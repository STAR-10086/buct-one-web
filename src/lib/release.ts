/* 纯构建期渲染辅助 + Toast 进退场动画 + 通用复制 */
export function miniMarkdown(md: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  const lines = md.split(/\r?\n/);
  let html = '';
  let list: '' | 'ul' | 'ol' = '';
  let inTable = false;
  const closeList = () => {
    if (list) {
      html += '</' + list + '>';
      list = '';
    }
  };
  const closeTable = () => {
    if (inTable) {
      html += '</tbody></table>';
      inTable = false;
    }
  };
  const isRow = (s: string) => /^\s*\|.*\|\s*$/.test(s);
  const isSep = (s: string) => isRow(s) && /^[\s|:-]+$/.test(s) && s.includes('-');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isRow(line)) {
      closeList();
      if (isSep(line)) continue;
      const cells = line
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((c) => c.trim());
      if (!inTable) {
        html += '<table class="md-table">';
        if (isSep(lines[i + 1] || '')) {
          html += '<thead><tr>' + cells.map((c) => '<th>' + inline(c) + '</th>').join('') + '</tr></thead><tbody>';
        } else {
          html += '<tbody><tr>' + cells.map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>';
        }
        inTable = true;
        continue;
      }
      html += '<tr>' + cells.map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>';
      continue;
    }
    closeTable();
    const ul = line.match(/^\s*[-*]\s+(.*)/);
    const ol = line.match(/^\s*\d+\.\s+(.*)/);
    if (ul || ol) {
      const want = ul ? 'ul' : 'ol';
      if (list !== want) {
        closeList();
        html += '<' + want + '>';
        list = want;
      }
      html += '<li>' + inline((ul || ol)![1]) + '</li>';
      continue;
    }
    closeList();
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) {
      const lv = Math.min(4, h[1].length + 2);
      html += '<h' + lv + '>' + inline(h[2]) + '</h' + lv + '>';
      continue;
    }
    const bq = line.match(/^>\s?(.*)/);
    if (bq) {
      html += '<blockquote>' + inline(bq[1]) + '</blockquote>';
      continue;
    }
    if (/^\s*(---|\*\*\*)\s*$/.test(line)) {
      html += '<hr>';
      continue;
    }
    if (line.trim()) html += '<p>' + inline(line) + '</p>';
  }
  closeList();
  closeTable();
  return html;
}

export function showToast(msg: string): void {
  let host = document.querySelector<HTMLElement>('[data-toast-host]');
  if (!host) {
    host = document.createElement('div');
    host.dataset.toastHost = '';
    document.body.appendChild(host);
  }
  while (host.children.length >= 3) {
    host.firstElementChild?.remove();
  }
  const t = document.createElement('div');
  t.className = 'cap-toast';
  t.setAttribute('role', 'status');
  t.textContent = msg;
  host.appendChild(t);
  window.setTimeout(() => {
    t.classList.add('is-leaving');
    window.setTimeout(() => t.remove(), 240);
  }, 2200);
}

async function copyText(text: string, label: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    showToast(`已复制 ${label}`);
  } catch {
    showToast('复制失败，请手动选择');
  }
}

export function initCopySha(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-copy-sha]').forEach((btn) => {
    if (btn.dataset.copyBound === '1') return;
    btn.dataset.copyBound = '1';
    btn.addEventListener('click', () => {
      const sha = document.querySelector<HTMLElement>('[data-rel="sha256"]')?.textContent?.trim() || '';
      if (sha) void copyText(sha, 'SHA256');
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-copy-text]').forEach((btn) => {
    if (btn.dataset.copyBound === '1') return;
    btn.dataset.copyBound = '1';
    btn.addEventListener('click', () => {
      const text = btn.dataset.copyText || '';
      const label = btn.dataset.copyLabel || '内容';
      if (text) void copyText(text, label);
    });
  });
}
