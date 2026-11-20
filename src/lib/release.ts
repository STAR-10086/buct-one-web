/* 下载数据流（PLAN §7）：构建快照打底 + localStorage 6h → R2 → GitHub(ETag/退避) → 快照兜底 */
export interface Release {
  version: string; tag: string; apkUrl: string; sizeBytes: number; sha256: string;
  publishedAt: string; changelogMd?: string; githubReleaseUrl?: string;
  minSdk?: number; abi?: string; fetchedAt?: string; source?: string;
}
const DL = (import.meta.env.PUBLIC_DL_DOMAIN || 'https://dl.buct.one').replace(/\/$/, '');
const GH_API = 'https://api.github.com/repos/STAR-10086/buct-one/releases/latest';
const CACHE_KEY = 'buctone.release';
const BACKOFF_KEY = 'buctone.ghBackoff';
const ETAG_KEY = 'buctone.ghEtag';
const TTL = 6 * 3600 * 1000;

// 下载域迁移兜底：R2 里历史 meta/latest.json 的 apkUrl 仍指向旧域，读入时归一化
const OLD_DL_HOST = /^(dl|update)\.buctone\.cc\.cd$/i;
const fixDomain = (url: string): string => {
  try {
    const u = new URL(url);
    if (OLD_DL_HOST.test(u.hostname)) return DL + u.pathname + u.search;
  } catch { /* noop */ }
  return url;
};
const normalize = (r: Release): Release => ({
  ...r,
  apkUrl: fixDomain(r.apkUrl),
  changelogMd: r.changelogMd ? r.changelogMd.replace(/buctone\.cc\.cd/gi, 'buct.one') : r.changelogMd,
});

function assert(r: any): r is Release {
  return r && typeof r.version === 'string' && typeof r.tag === 'string'
    && typeof r.apkUrl === 'string' && r.apkUrl.startsWith('https://')
    && typeof r.sizeBytes === 'number' && typeof r.publishedAt === 'string'
    && (!r.sha256 || /^[a-f0-9]{64}$/.test(r.sha256));
}
async function fetchTimeout(url: string, opts: RequestInit = {}, ms = 5000): Promise<Response> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ctl.signal }); } finally { clearTimeout(t); }
}
async function fetchR2(): Promise<Release | null> {
  for (let i = 0; i < 2; i++) {
    try {
      const res = await fetchTimeout(DL + '/meta/latest.json', { cache: 'no-cache' });
      if (!res.ok) continue;
      const j = await res.json();
      if (assert(j)) return normalize({ ...j, source: 'r2' });
    } catch { /* retry */ }
  }
  return null;
}
function mapGitHub(j: any, sha256: string): Release | null {
  const asset = (j.assets || []).find((a: any) => /\.apk$/i.test(a.name || ''));
  if (!asset) return null;
  return {
    version: String(j.tag_name || '').replace(/^v/, ''), tag: j.tag_name,
    apkUrl: asset.browser_download_url, sizeBytes: asset.size || 0,
    sha256, publishedAt: j.published_at || j.created_at,
    changelogMd: j.body || '', githubReleaseUrl: j.html_url,
    minSdk: 24, abi: 'universal', source: 'github',
  };
}
async function fetchGitHub(): Promise<Release | null> {
  const backoff = Number(localStorage.getItem(BACKOFF_KEY) || 0);
  if (Date.now() < backoff) return null;
  try {
    const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
    const etag = localStorage.getItem(ETAG_KEY);
    if (etag) headers['If-None-Match'] = etag;
    const res = await fetchTimeout(GH_API, { headers });
    if (res.status === 304) { const c = readCache(); return c?.data ?? null; }
    if (res.status === 403 || res.status === 429) {
      if (res.headers.get('X-RateLimit-Remaining') === '0') {
        const reset = Number(res.headers.get('X-RateLimit-Reset') || 0) * 1000;
        localStorage.setItem(BACKOFF_KEY, String(reset || Date.now() + 3600_000));
      }
      return null;
    }
    if (!res.ok) return null;
    const newEtag = res.headers.get('ETag'); if (newEtag) localStorage.setItem(ETAG_KEY, newEtag);
    const j = await res.json();
    let sha = '';
    const digest: string = j.assets?.find((a: any) => /.apk$/i.test(a.name || ''))?.digest || '';
    if (digest.startsWith('sha256:')) sha = digest.slice(7);
    if (!sha) {
      const side = (j.assets || []).find((a: any) => /.sha256$/i.test(a.name || ''));
      if (side) { try { const t = await (await fetchTimeout(side.browser_download_url)).text(); const m = t.match(/[a-f0-9]{64}/i); if (m) sha = m[0].toLowerCase(); } catch { /* noop */ } }
    }
    const r = mapGitHub(j, sha);
    return r && assert(r) ? normalize(r) : null;
  } catch { return null; }
}
export function readCache(): { fetchedAt: number; data: Release } | null {
  try { const c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); return c && c.data ? c : null; } catch { return null; }
}
function writeCache(data: Release): void {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), data })); } catch { /* noop */ }
}
export async function refreshRelease(snapshot: Release, force = false): Promise<{ data: Release; source: string }> {
  const cache = readCache();
  if (!force && cache && Date.now() - cache.fetchedAt < TTL) return { data: cache.data, source: cache.data.source || 'cache' };
  let r = await fetchR2();
  if (!r) r = await fetchGitHub();
  if (r) {
    const cur = cache?.data ?? snapshot;
    if (cmpVersion(r.version, cur.version) >= 0) { writeCache(r); return { data: r, source: r.source || 'r2' }; }
    return { data: cur, source: cur.source || 'snapshot' };
  }
  if (cache) return { data: cache.data, source: cache.data.source || 'cache' };
  return { data: snapshot, source: 'snapshot' };
}
export function cmpVersion(a: string, b: string): number {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) { const d = (pa[i] || 0) - (pb[i] || 0); if (d) return d; }
  return 0;
}
export const formatSize = (n: number): string => n > 0 ? (n / 1048576).toFixed(1) + ' MB' : '—';
export const formatDate = (iso: string): string => { try { return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }); } catch { return iso; } };
const SOURCE_LABEL: Record<string, string> = { r2: '实时 · R2', github: 'GitHub 回退', cache: '本地缓存', snapshot: '离线快照' };
export function renderRelease(r: Release, source: string): void {
  const set = (key: string, val: string) => document.querySelectorAll<HTMLElement>('[data-rel="' + key + '"]').forEach((el) => { el.textContent = val; });
  set('version', 'v' + r.version);
  set('date', formatDate(r.publishedAt));
  set('size', formatSize(r.sizeBytes));
  set('sha256', r.sha256 || '未提供');
  set('badge', SOURCE_LABEL[source] || source);
  const apk = r.apkUrl || r.githubReleaseUrl || '';
  document.querySelectorAll<HTMLAnchorElement>('[data-rel="apk-href"]').forEach((a) => { a.href = apk; });
  const gh = r.githubReleaseUrl || 'https://github.com/STAR-10086/buct-one/releases';
  document.querySelectorAll<HTMLAnchorElement>('[data-rel="gh-href"]').forEach((a) => { a.href = gh; });
  const shaRow = document.querySelector<HTMLElement>('[data-rel="sha-row"]');
  if (shaRow) shaRow.hidden = !r.sha256;
  const cl = document.querySelector<HTMLElement>('[data-rel="changelog"]');
  if (cl && r.changelogMd) cl.innerHTML = miniMarkdown(r.changelogMd);
}
/* 极简 Markdown：标题/列表(有序无序)/粗体/代码/引用/分隔线/管道表格 */
export function miniMarkdown(md: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s: string) => esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
  const lines = md.split(/\r?\n/);
  let html = '';
  let list: '' | 'ul' | 'ol' = '';
  let inTable = false;
  const closeList = () => { if (list) { html += '</' + list + '>'; list = ''; } };
  const closeTable = () => { if (inTable) { html += '</tbody></table>'; inTable = false; } };
  const isRow = (s: string) => /^\s*\|.*\|\s*$/.test(s);
  const isSep = (s: string) => isRow(s) && /^[\s|:-]+$/.test(s) && s.includes('-');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isRow(line)) {
      closeList();
      if (isSep(line)) continue;
      const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
      if (!inTable) {
        html += '<table class="md-table">';
        if (isSep(lines[i + 1] || '')) { html += '<thead><tr>' + cells.map((c) => '<th>' + inline(c) + '</th>').join('') + '</tr></thead><tbody>'; }
        else { html += '<tbody><tr>' + cells.map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>'; }
        inTable = true; continue;
      }
      html += '<tr>' + cells.map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>';
      continue;
    }
    closeTable();
    const ul = line.match(/^\s*[-*]\s+(.*)/);
    const ol = line.match(/^\s*\d+\.\s+(.*)/);
    if (ul || ol) {
      const want = ul ? 'ul' : 'ol';
      if (list !== want) { closeList(); html += '<' + want + '>'; list = want; }
      html += '<li>' + inline((ul || ol)![1]) + '</li>';
      continue;
    }
    closeList();
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) { const lv = Math.min(4, h[1].length + 2); html += '<h' + lv + '>' + inline(h[2]) + '</h' + lv + '>'; continue; }
    const bq = line.match(/^>\s?(.*)/);
    if (bq) { html += '<blockquote>' + inline(bq[1]) + '</blockquote>'; continue; }
    if (/^\s*(---|\*\*\*)\s*$/.test(line)) { html += '<hr>'; continue; }
    if (line.trim()) html += '<p>' + inline(line) + '</p>';
  }
  closeList(); closeTable();
  return html;
}
export function initRelease(snapshot: Release): void {
  renderRelease(snapshot, snapshot.source || 'snapshot');
  refreshRelease(snapshot).then(({ data, source }) => renderRelease(data, source));
  document.querySelectorAll<HTMLButtonElement>('[data-rel-refresh]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      const { data, source } = await refreshRelease(snapshot, true);
      renderRelease(data, source);
      btn.disabled = false;
    });
  });
  document.querySelectorAll<HTMLButtonElement>('[data-copy-sha]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const sha = document.querySelector<HTMLElement>('[data-rel="sha256"]')?.textContent || '';
      try { await navigator.clipboard.writeText(sha); showToast('已复制 SHA256'); } catch { showToast('复制失败，请手动选择'); }
    });
  });
}
export function showToast(msg: string): void {
  let host = document.querySelector<HTMLElement>('[data-toast-host]');
  if (!host) { host = document.createElement('div'); host.dataset.toastHost = ''; host.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:300;'; document.body.appendChild(host); }
  const t = document.createElement('div');
  t.className = 'cap-toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  host.appendChild(t);
  setTimeout(() => t.remove(), 2400);
}

/* ── 更新日志：运行时从 R2 拉全量 CHANGELOG.md，失败保留构建期内容 ── */
const CL_CACHE_KEY = 'buctone.changelog';
export async function refreshChangelog(): Promise<string | null> {
  try {
    const raw = localStorage.getItem(CL_CACHE_KEY);
    if (raw) { const c = JSON.parse(raw); if (c && typeof c.text === 'string' && Date.now() - c.fetchedAt < TTL) return null; }
  } catch { /* noop */ }
  try {
    const res = await fetchTimeout(DL + '/meta/changelog.md', { cache: 'no-cache' }, 6000);
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.trim() || !/^## /m.test(text)) return null;
    try { localStorage.setItem(CL_CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), text })); } catch { /* noop */ }
    return text;
  } catch { return null; }
}
export interface ChangelogVersion { name: string; date: string; html: string; unreleased: boolean; }
export function parseChangelog(md: string): ChangelogVersion[] {
  return md.split(/^## /m).slice(1).map((chunk) => {
    const nl = chunk.indexOf('\n');
    const header = (nl === -1 ? chunk : chunk.slice(0, nl)).trim();
    const body = nl === -1 ? '' : chunk.slice(nl + 1);
    const m = header.match(/\[([^\]]+)\]\s*(?:-\s*(.*))?/);
    const name = m ? m[1] : header;
    return { name, date: m && m[2] ? m[2].trim() : '', html: miniMarkdown(body), unreleased: name.toLowerCase() === 'unreleased' };
  });
}
const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export function renderChangelogTimeline(versions: ChangelogVersion[]): string {
  return versions.map((v) => {
    const id = 'v' + escHtml(v.name).replace(/\./g, '-');
    const head = v.unreleased ? '开发中' : 'v' + escHtml(v.name);
    return '<article class="glass-content cap-card version-card" id="' + id + '">'
      + '<div class="version-head"><h3>' + head + '</h3>'
      + (v.date ? '<span class="cap-chip">' + escHtml(v.date) + '</span>' : '')
      + (v.unreleased ? '<span class="cap-chip soon">未发布</span>' : '')
      + '</div><div class="md">' + v.html + '</div></article>';
  }).join('');
}
export function initChangelog(): void {
  const root = document.querySelector<HTMLElement>('[data-changelog-root]');
  if (!root) return;
  refreshChangelog().then((text) => {
    if (!text) return;
    const versions = parseChangelog(text);
    if (!versions.length) return;
    root.innerHTML = renderChangelogTimeline(versions);
    const badge = document.querySelector<HTMLElement>('[data-changelog-badge]');
    if (badge) badge.textContent = '已同步最新日志';
  });
}

