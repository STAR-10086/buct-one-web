// 构建期预取（PLAN §7.6）：R2 → GitHub → 仓库内快照；永不 fail build。
import { writeFile, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DL = (process.env.PUBLIC_DL_DOMAIN || 'https://dl.buct.one').replace(/\/$/, '');
const SNAP = ROOT + 'src/data/release-snapshot.json';
const CL_CACHE = ROOT + 'src/data/changelog-cache.md';
const CL_FALLBACK = ROOT + 'src/data/changelog-fallback.md';
const RAW_CL = 'https://raw.githubusercontent.com/STAR-10086/buct-one/main/CHANGELOG.md';
const GH_API = 'https://api.github.com/repos/STAR-10086/buct-one/releases/latest';
async function ft(url, opts = {}, ms = 6000) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ctl.signal }); } finally { clearTimeout(t); }
}
const ok = (r) => r && typeof r.version === 'string' && typeof r.apkUrl === 'string' && typeof r.sizeBytes === 'number';
let snapshot = null, source = 'snapshot';
try { const r = await ft(DL + '/meta/latest.json', { cache: 'no-cache' }); if (r.ok) { const j = await r.json(); if (ok(j)) { snapshot = j; source = 'r2'; } } } catch (e) { console.warn('[prefetch] R2 fail:', e.message); }
if (!snapshot) {
  try {
    const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'buct-one-web-prefetch' };
    if (process.env.GITHUB_TOKEN) headers.Authorization = 'Bearer ' + process.env.GITHUB_TOKEN;
    const r = await ft(GH_API, { headers });
    if (r.ok) {
      const j = await r.json();
      const apks = (j.assets || []).filter((x) => /\.apk$/i.test(x.name || '') && !/debug/i.test(x.name || ''));
      const a = apks.find((x) => /arm64-v8a/i.test(x.name)) || apks.find((x) => /universal/i.test(x.name)) || apks[0];
      if (a) {
        let sha = (a.digest || '').startsWith('sha256:') ? a.digest.slice(7) : '';
        if (!sha) {
          const s = (j.assets || []).find((x) => x.name === a.name + '.sha256');
          if (s) { try { const sr = await ft(s.browser_download_url, {}, 6000); if (sr.ok) sha = (await sr.text()).trim().split(/\s+/)[0].toLowerCase(); } catch (e) { console.warn('[prefetch] sha256 asset fail:', e.message); } }
        }
        const abi = /arm64-v8a/i.test(a.name) ? 'arm64-v8a' : /armeabi-v7a/i.test(a.name) ? 'armeabi-v7a' : 'universal';
        snapshot = { schemaVersion: 1, version: String(j.tag_name || '').replace(/^v/, ''), tag: j.tag_name, apkUrl: a.browser_download_url, sizeBytes: a.size || 0, sha256: sha, publishedAt: j.published_at || j.created_at, changelogMd: j.body || '', githubReleaseUrl: j.html_url, minSdk: 24, targetSdk: 34, abi };
        source = 'github';
      }
    }
  } catch (e) { console.warn('[prefetch] GitHub fail:', e.message); }
}
if (snapshot) {
  const FIX = (s) => typeof s === 'string' ? s.replace(/buctone\.cc\.cd/gi, 'buct.one') : s;
  snapshot.apkUrl = FIX(snapshot.apkUrl);
  if (snapshot.changelogMd) snapshot.changelogMd = FIX(snapshot.changelogMd);
  snapshot.fetchedAt = new Date().toISOString(); snapshot.source = source;
  await writeFile(SNAP, JSON.stringify(snapshot, null, 2) + '\n');
  console.log('[prefetch] snapshot from', source, 'v' + snapshot.version);
} else {
  console.warn('[prefetch] both sources failed; keeping committed snapshot');
}
let clDone = false;
try { const r = await ft(DL + '/meta/changelog.md', { cache: 'no-cache' }); if (r.ok) { const t = await r.text(); if (t.trim()) { await writeFile(CL_CACHE, t.replace(/buctone\.cc\.cd/gi, 'buct.one')); console.log('[prefetch] changelog from R2'); clDone = true; } } } catch (e) { console.warn('[prefetch] R2 changelog fail:', e.message); }
if (!clDone) {
  try { const r = await ft(RAW_CL); if (r.ok) { await writeFile(CL_CACHE, (await r.text()).replace(/buctone\.cc\.cd/gi, 'buct.one')); console.log('[prefetch] changelog from raw'); clDone = true; } else throw new Error('HTTP ' + r.status); }
  catch { if (existsSync(CL_FALLBACK)) { await copyFile(CL_FALLBACK, CL_CACHE); console.log('[prefetch] changelog fallback'); } }
}
