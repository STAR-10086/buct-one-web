/* Web 液态玻璃引擎（PLAN §6）：SDF 位移折射（参考仓库 MIT 算法）+ 降级链 + 果冻 + 透镜拖拽。
   失败一次整体降档（照搬 App GlassLensEngine 语义）。色散三角色开关预留，M1 默认单路。 */
import { springEase } from './spring-physics';
import { readGlass } from './theme';

const SVGNS = 'http://www.w3.org/2000/svg';
const XLINK = 'http://www.w3.org/1999/xlink';
let uid = 0;
let failed = false;

const smoothStep = (a: number, b: number, t: number): number => { t = Math.max(0, Math.min(1, (t - a) / (b - a))); return t * t * (3 - 2 * t); };
const roundedRectSDF = (x: number, y: number, w: number, h: number, r: number): number => {
  const qx = Math.abs(x) - w + r, qy = Math.abs(y) - h + r;
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
};

export type Tier = 'full' | 'blur' | 'solid';
export function resolveTier(): Tier {
  const choice = readGlass();
  if (choice === 'solid') return 'solid';
  const reducedTransparency = matchMedia('(prefers-reduced-transparency: reduce)').matches;
  const saveData = (navigator as any).connection?.saveData === true;
  if (reducedTransparency || saveData) return 'solid';
  if (choice === 'blur') return 'blur';
  const isMobile = matchMedia('(max-width: 767px)').matches || matchMedia('(pointer: coarse)').matches;
  const lowEnd = ((navigator.hardwareConcurrency || 8) <= 4) || ((navigator as any).deviceMemory || 8) <= 4;
  const supportsUrl = CSS.supports('backdrop-filter', 'url(#x)');
  const supportsBlur = CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
  if (!isMobile && supportsUrl && !lowEnd && (choice === 'auto' || choice === 'full')) return 'full';
  return supportsBlur ? 'blur' : 'solid';
}

interface GlassInst { destroy(): void; setStrength(s: number): void; }
function makeGlass(el: HTMLElement, tint = 'rgba(255,255,255,0.08)'): GlassInst {
  const fid = 'lg-' + (++uid);
  let strength = 1;
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
  svg.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;';
  const filter = document.createElementNS(SVGNS, 'filter');
  filter.setAttribute('id', fid + '_filter');
  filter.setAttribute('filterUnits', 'userSpaceOnUse');
  filter.setAttribute('colorInterpolationFilters', 'sRGB');
  filter.setAttribute('x', '0'); filter.setAttribute('y', '0');
  const feImage = document.createElementNS(SVGNS, 'feImage');
  feImage.setAttribute('preserveAspectRatio', 'none');
  const feDisp = document.createElementNS(SVGNS, 'feDisplacementMap');
  feDisp.setAttribute('in', 'SourceGraphic'); feDisp.setAttribute('in2', fid + '_map');
  feDisp.setAttribute('xChannelSelector', 'R'); feDisp.setAttribute('yChannelSelector', 'G');
  filter.appendChild(feImage); filter.appendChild(feDisp);
  svg.appendChild(filter); document.body.appendChild(svg);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  let timer = 0;
  function update(): void {
    const W = Math.max(2, Math.min(512, el.offsetWidth));
    const H = Math.max(2, Math.min(512, el.offsetHeight));
    canvas.width = W; canvas.height = H;
    filter.setAttribute('width', String(W)); filter.setAttribute('height', String(H));
    feImage.setAttribute('width', String(W)); feImage.setAttribute('height', String(H));
    const data = new Uint8ClampedArray(W * H * 4);
    const raw: number[] = []; let maxScale = 0;
    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % W, y = Math.floor(i / 4 / W);
      const ix = x / W - 0.5, iy = y / H - 0.5;
      const d = roundedRectSDF(ix, iy, 0.3, 0.2, 0.6);
      const disp = smoothStep(0.8, 0, d - 0.15 / strength);
      const s = smoothStep(0, 1, disp);
      const dx = (ix * s + 0.5) * W - x, dy = (iy * s + 0.5) * H - y;
      maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy));
      raw.push(dx, dy);
    }
    maxScale *= 0.5;
    let idx = 0;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = (raw[idx++] / maxScale + 0.5) * 255;
      data[i + 1] = (raw[idx++] / maxScale + 0.5) * 255;
      data[i + 2] = 0; data[i + 3] = 255;
    }
    ctx.putImageData(new ImageData(data, W, H), 0, 0);
    feImage.setAttributeNS(XLINK, 'href', canvas.toDataURL());
    feDisp.setAttribute('scale', String(maxScale));
    const bf = 'url(#' + fid + '_filter) blur(0.25px) contrast(1.2) brightness(1.05) saturate(1.1)';
    el.style.backdropFilter = bf; (el.style as any).webkitBackdropFilter = bf;
    el.style.background = tint;
  }
  update();
  const ro = new ResizeObserver(() => { clearTimeout(timer); timer = window.setTimeout(update, 150); });
  ro.observe(el);
  return {
    destroy() { ro.disconnect(); clearTimeout(timer); svg.remove(); canvas.remove(); el.style.backdropFilter = ''; (el.style as any).webkitBackdropFilter = ''; },
    setStrength(s: number) { strength = s; update(); },
  };
}

function attachJelly(el: HTMLElement): void {
  const rest = el.style.boxShadow;
  el.addEventListener('pointerdown', () => {
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,.3), inset 0 8px 18px rgba(0,0,0,.22)';
    el.style.transform = 'scale(1.05, 0.93)';
  });
  const release = () => {
    el.style.boxShadow = rest;
    const t0 = performance.now();
    const from = 0.07;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / 500);
      const k = from * (1 - springEase(t));
      el.style.transform = 'scale(' + (1 + k) + ',' + (1 - k * 0.6) + ')';
      if (t < 1) requestAnimationFrame(tick); else el.style.transform = '';
    };
    requestAnimationFrame(tick);
  };
  el.addEventListener('pointerup', release);
  el.addEventListener('pointerleave', release);
}

function attachDrag(el: HTMLElement): void {
  const parent = el.parentElement!;
  let on = false, sx = 0, sy = 0, bx = 0, by = 0, tx = 0, ty = 0, lx = 0, ly = 0, lt = 0, vx = 0, vy = 0, raf = 0;
  const clamp = () => {
    const pw = parent.clientWidth, ph = parent.clientHeight;
    tx = Math.max(0, Math.min(pw - el.offsetWidth, tx));
    ty = Math.max(0, Math.min(ph - el.offsetHeight, ty));
  };
  el.addEventListener('pointerdown', (e) => {
    on = true; cancelAnimationFrame(raf);
    sx = e.clientX; sy = e.clientY; bx = el.offsetLeft; by = el.offsetTop; tx = bx; ty = by;
    lx = e.clientX; ly = e.clientY; lt = performance.now(); vx = vy = 0;
    try { el.setPointerCapture(e.pointerId); } catch { /* noop */ }
    e.preventDefault();
  });
  el.addEventListener('pointermove', (e) => {
    if (!on) return;
    tx = bx + (e.clientX - sx); ty = by + (e.clientY - sy); clamp();
    const now = performance.now(), dt = Math.max(1, now - lt);
    vx = vx * 0.7 + (e.clientX - lx) / dt * 16 * 0.3;
    vy = vy * 0.7 + (e.clientY - ly) / dt * 16 * 0.3;
    lx = e.clientX; ly = e.clientY; lt = now;
    el.style.left = tx + 'px'; el.style.top = ty + 'px';
    const speed = Math.hypot(vx, vy);
    const k = Math.min(0.16, speed / 420);
    const deg = speed > 0.5 ? Math.atan2(vy, vx) * 180 / Math.PI : 0;
    el.style.transform = 'rotate(' + deg + 'deg) scale(' + (1 + k) + ',' + (1 - k * 0.45) + ') rotate(' + (-deg) + 'deg)';
    const glow = Math.min(0.85, speed / 26);
    el.style.boxShadow = '0 4px 8px rgba(0,0,0,.22), 0 -10px 25px inset rgba(0,0,0,.12), 0 0 ' + (18 + speed * 2.2) + 'px rgba(255,255,255,' + (0.12 + glow * 0.5).toFixed(2) + ')';
  });
  const end = () => {
    if (!on) return; on = false;
    const glide = () => {
      vx *= 0.94; vy *= 0.94; tx += vx; ty += vy; clamp();
      el.style.left = tx + 'px'; el.style.top = ty + 'px';
      const speed = Math.hypot(vx, vy);
      if (speed > 0.4) { raf = requestAnimationFrame(glide); }
      else { el.style.transform = ''; el.style.boxShadow = ''; }
    };
    raf = requestAnimationFrame(glide);
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}

const instances: GlassInst[] = [];
export function initGlass(): void {
  const tier = resolveTier();
  document.documentElement.dataset.glass = tier;
  if (tier !== 'full' || failed) return;
  try {
    document.querySelectorAll<HTMLElement>('[data-lens]').forEach((el) => {
      instances.push(makeGlass(el));
      attachDrag(el);
    });
    document.querySelectorAll<HTMLElement>('[data-jelly]').forEach(attachJelly);
  } catch {
    failed = true;
    instances.forEach((i) => i.destroy());
    document.documentElement.dataset.glass = 'blur';
  }
  matchMedia('(prefers-reduced-transparency: reduce)').addEventListener('change', () => {
    document.documentElement.dataset.glass = resolveTier();
  });
}
export function initScrollPause(): void {
  let t = 0;
  addEventListener('scroll', () => {
    document.documentElement.classList.add('is-scrolling');
    clearTimeout(t);
    t = window.setTimeout(() => document.documentElement.classList.remove('is-scrolling'), 120);
  }, { passive: true });
}
