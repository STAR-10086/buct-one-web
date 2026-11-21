/* 纯构建期渲染辅助：前端不请求 R2 / GitHub，仅提供构建期 Markdown 解析与 SHA256 复制提示 */
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

export function showToast(msg: string): void {
  let host = document.querySelector<HTMLElement>('[data-toast-host]');
  if (!host) {
    host = document.createElement('div');
    host.dataset.toastHost = '';
    host.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:300;';
    document.body.appendChild(host);
  }
  const t = document.createElement('div');
  t.className = 'cap-toast';
  t.setAttribute('role', 'status');
  t.textContent = msg;
  host.appendChild(t);
  setTimeout(() => t.remove(), 2400);
}

export function initCopySha(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-copy-sha]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const sha = document.querySelector<HTMLElement>('[data-rel="sha256"]')?.textContent || '';
      try {
        await navigator.clipboard.writeText(sha);
        showToast('已复制 SHA256');
      } catch {
        showToast('复制失败，请手动选择');
      }
    });
  });
}
