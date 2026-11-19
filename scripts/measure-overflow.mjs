const pages = ['/', '/download/', '/changelog/', '/about/', '/404.html'];
const list = await (await fetch('http://127.0.0.1:9222/json')).json();
const page = list.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const send = (method, params) => new Promise((res) => {
  const myId = ++id;
  const h = (e) => { const m = JSON.parse(e.data); if (m.id === myId) { ws.removeEventListener('message', h); res(m); } };
  ws.addEventListener('message', h);
  ws.send(JSON.stringify({ id: myId, method, params }));
});
await send('Page.enable', {});
await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 3, mobile: true });
const expr = `(() => {
  const vw = document.documentElement.clientWidth;
  const items = [];
  document.querySelectorAll('body *').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    if (r.right > vw + 1 || Math.round(r.width) > vw + 1) {
      items.push(el.tagName.toLowerCase() + '.' + (el.getAttribute('class') || '').split(' ').slice(0,2).join('.') + ' w=' + Math.round(r.width) + ' right=' + Math.round(r.right));
    }
  });
  return JSON.stringify({ vw, docSW: document.documentElement.scrollWidth, bodySW: document.body.scrollWidth, n: items.length, top: items.slice(0, 8) });
})()`;
for (const p of pages) {
  await send('Page.navigate', { url: 'http://localhost:4321' + p });
  await new Promise((r) => setTimeout(r, 1800));
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
  console.log(p, '=>', r.result?.result?.value ?? 'ERR');
}
ws.close();
