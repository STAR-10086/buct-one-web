/* Web 液态玻璃引擎：SDF 位移折射 + 降级链 + 修复版果冻弹簧 + GPU 透镜拖拽与镜面高光 */
import { animateSpring, springEase } from './spring-physics';
import { readGlass } from './theme';

const SVGNS = 'http://www.w3.org/2000/svg';
const XLINK = 'http://www.w3.org/1999/xlink';
let uid = 0;
let failed = false;
let mediaBound = false;

const smoothStep = (a: number, b: number, t: number): number => {
  t = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const roundedRectSDF = (x: number, y: number, w: number, h: number, r: number): number => {
  const qx = Math.abs(x) - w + r;
  const qy = Math.abs(y) - h + r;
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
  const lowEnd = (navigator.hardwareConcurrency || 8) <= 4 || ((navigator as any).deviceMemory || 8) <= 4;
  const supportsUrl = CSS.supports('backdrop-filter', 'url(#x)');
  const supportsBlur =
    CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
  if (!isMobile && supportsUrl && !lowEnd && (choice === 'auto' || choice === 'full')) return 'full';
  return supportsBlur ? 'blur' : 'solid';
}

interface GlassInst {
  destroy(): void;
  setStrength(s: number): void;
}

function makeGlass(el: HTMLElement, tint = 'rgba(255,255,255,0.08)'): GlassInst {
  const fid = 'lg-' + ++uid;
  let strength = 1;
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;';
  const filter = document.createElementNS(SVGNS, 'filter');
  filter.setAttribute('id', fid + '_filter');
  filter.setAttribute('filterUnits', 'userSpaceOnUse');
  filter.setAttribute('colorInterpolationFilters', 'sRGB');
  filter.setAttribute('x', '0');
  filter.setAttribute('y', '0');
  const feImage = document.createElementNS(SVGNS, 'feImage');
  feImage.setAttribute('preserveAspectRatio', 'none');
  feImage.setAttribute('result', fid + '_map');
  const feDisp = document.createElementNS(SVGNS, 'feDisplacementMap');
  feDisp.setAttribute('in', 'SourceGraphic');
  feDisp.setAttribute('in2', fid + '_map');
  feDisp.setAttribute('xChannelSelector', 'R');
  feDisp.setAttribute('yChannelSelector', 'G');
  filter.appendChild(feImage);
  filter.appendChild(feDisp);
  svg.appendChild(filter);
  document.body.appendChild(svg);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  let timer = 0;

  function update(): void {
    const W = Math.max(2, Math.min(512, el.offsetWidth));
    const H = Math.max(2, Math.min(512, el.offsetHeight));
    canvas.width = W;
    canvas.height = H;
    filter.setAttribute('width', String(W));
    filter.setAttribute('height', String(H));
    feImage.setAttribute('width', String(W));
    feImage.setAttribute('height', String(H));
    const data = new Uint8ClampedArray(W * H * 4);
    const raw: number[] = [];
    let maxScale = 0;
    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % W;
      const y = Math.floor(i / 4 / W);
      const ix = x / W - 0.5;
      const iy = y / H - 0.5;
      const d = roundedRectSDF(ix, iy, 0.3, 0.2, 0.6);
      const disp = smoothStep(0.8, 0, d - 0.15 / strength);
      const s = smoothStep(0, 1, disp);
      const dx = (ix * s + 0.5) * W - x;
      const dy = (iy * s + 0.5) * H - y;
      maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy));
      raw.push(dx, dy);
    }
    maxScale = Math.max(0.001, maxScale * 0.5);
    let idx = 0;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = (raw[idx++] / maxScale + 0.5) * 255;
      data[i + 1] = (raw[idx++] / maxScale + 0.5) * 255;
      data[i + 2] = 0;
      data[i + 3] = 255;
    }
    ctx.putImageData(new ImageData(data, W, H), 0, 0);
    feImage.setAttributeNS(XLINK, 'href', canvas.toDataURL());
    feDisp.setAttribute('scale', String(maxScale));
    const bf = 'url(#' + fid + '_filter) blur(0.25px) contrast(1.18) brightness(1.04) saturate(1.12)';
    el.style.backdropFilter = bf;
    (el.style as any).webkitBackdropFilter = bf;
    el.style.background = tint;
  }

  update();
  const ro = new ResizeObserver(() => {
    clearTimeout(timer);
    timer = window.setTimeout(update, 150);
  });
  ro.observe(el);

  return {
    destroy() {
      ro.disconnect();
      clearTimeout(timer);
      svg.remove();
      canvas.remove();
      el.style.backdropFilter = '';
      (el.style as any).webkitBackdropFilter = '';
      el.style.background = '';
    },
    setStrength(s: number) {
      strength = s;
      update();
    },
  };
}

function attachJelly(el: HTMLElement): void {
  if (el.dataset.jellyBound === '1') return;
  el.dataset.jellyBound = '1';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const restShadow = el.style.boxShadow;
  let pressed = false;
  let raf = 0;

  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pressed = true;
    cancelAnimationFrame(raf);
    el.style.transition = 'transform 85ms ease-out, box-shadow 85ms ease-out';
    el.style.boxShadow = '0 2px 6px rgba(0,0,0,.22), inset 0 6px 14px rgba(0,0,0,.18)';
    el.style.transform = 'scale(1.045, 0.935)';
  });

  const release = () => {
    if (!pressed) return;
    pressed = false;
    el.style.boxShadow = restShadow;
    el.style.transition = 'none';
    const t0 = performance.now();
    const from = 0.065;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / 460);
      const k = from * (1 - springEase(t));
      el.style.transform = `scale(${(1 + k).toFixed(4)}, ${(1 - k * 0.6).toFixed(4)})`;
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        el.style.transform = '';
        el.style.transition = '';
      }
    };
    raf = requestAnimationFrame(tick);
  };

  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);
  el.addEventListener('pointerleave', release);
}

function attachDrag(el: HTMLElement): void {
  if (el.dataset.lensBound === '1') return;
  el.dataset.lensBound = '1';
  const parent = el.parentElement;
  if (!parent) return;

  let dragging = false;
  let sx = 0,
    sy = 0;
  let baseOx = 0,
    baseOy = 0;
  let ox = 0,
    oy = 0;
  let lx = 0,
    ly = 0,
    lt = 0;
  let vx = 0,
    vy = 0;
  let raf = 0;
  let stopSpring: (() => void) | null = null;

  const updateGlow = (clientX: number, clientY: number, opacity: number) => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const px = Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
    const py = Math.max(0, Math.min(100, ((clientY - r.top) / r.height) * 100));
    el.style.setProperty('--lx', `${px.toFixed(1)}%`);
    el.style.setProperty('--ly', `${py.toFixed(1)}%`);
    el.style.setProperty('--glow-op', opacity.toFixed(2));
  };

  const clampOffset = (nx: number, ny: number): [number, number] => {
    const minX = -el.offsetLeft;
    const maxX = Math.max(minX, parent.clientWidth - el.offsetWidth - el.offsetLeft);
    const minY = -el.offsetTop;
    const maxY = Math.max(minY, parent.clientHeight - el.offsetHeight - el.offsetTop);
    return [Math.max(minX, Math.min(maxX, nx)), Math.max(minY, Math.min(maxY, ny))];
  };

  const applyTransform = (x: number, y: number, k = 0, deg = 0) => {
    if (k > 0.001) {
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${deg.toFixed(1)}deg) scale(${(1 + k).toFixed(4)}, ${(1 - k * 0.42).toFixed(4)}) rotate(${(-deg).toFixed(1)}deg)`;
    } else {
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    }
  };

  el.addEventListener('pointerenter', (e) => {
    if (!dragging) updateGlow(e.clientX, e.clientY, 0.58);
  });

  el.addEventListener('pointerdown', (e) => {
    dragging = true;
    cancelAnimationFrame(raf);
    stopSpring?.();
    stopSpring = null;
    el.classList.add('is-dragging', 'has-moved');
    sx = e.clientX;
    sy = e.clientY;
    baseOx = ox;
    baseOy = oy;
    lx = e.clientX;
    ly = e.clientY;
    lt = performance.now();
    vx = vy = 0;
    updateGlow(e.clientX, e.clientY, 0.8);
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    e.preventDefault();
  });

  el.addEventListener('pointermove', (e) => {
    if (!dragging) {
      updateGlow(e.clientX, e.clientY, 0.58);
      return;
    }
    [ox, oy] = clampOffset(baseOx + (e.clientX - sx), baseOy + (e.clientY - sy));
    const now = performance.now();
    const dt = Math.max(1, now - lt);
    vx = vx * 0.65 + ((e.clientX - lx) / dt) * 16 * 0.35;
    vy = vy * 0.65 + ((e.clientY - ly) / dt) * 16 * 0.35;
    lx = e.clientX;
    ly = e.clientY;
    lt = now;
    const speed = Math.hypot(vx, vy);
    const k = Math.min(0.16, speed / 420);
    const deg = speed > 0.5 ? (Math.atan2(vy, vx) * 180) / Math.PI : 0;
    applyTransform(ox, oy, k, deg);
    const glow = Math.min(0.95, 0.45 + speed / 24);
    updateGlow(e.clientX, e.clientY, glow);
    el.style.boxShadow = `0 6px 14px rgba(0,0,0,.22), 0 -10px 25px inset rgba(0,0,0,.12), 0 0 ${(18 + speed * 2.2).toFixed(0)}px rgba(255,255,255,${(0.16 + glow * 0.4).toFixed(2)})`;
  });

  const end = () => {
    if (!dragging) return;
    dragging = false;
    el.classList.remove('is-dragging');
    const glide = () => {
      vx *= 0.93;
      vy *= 0.93;
      const [nx, ny] = clampOffset(ox + vx, oy + vy);
      if (nx === ox && Math.abs(vx) > 0.2) vx = -vx * 0.45;
      if (ny === oy && Math.abs(vy) > 0.2) vy = -vy * 0.45;
      ox = nx;
      oy = ny;
      const speed = Math.hypot(vx, vy);
      const k = Math.min(0.12, speed / 420);
      const deg = speed > 0.5 ? (Math.atan2(vy, vx) * 180) / Math.PI : 0;
      applyTransform(ox, oy, k, deg);
      if (speed > 0.35) {
        raf = requestAnimationFrame(glide);
      } else {
        el.style.boxShadow = '';
        el.style.setProperty('--glow-op', '0.28');
        stopSpring = animateSpring(
          Math.max(0.02, k),
          0,
          'liquidJellyRebound',
          (v) => applyTransform(ox, oy, Math.max(0, v), deg),
          () => applyTransform(ox, oy, 0, 0),
        );
      }
    };
    raf = requestAnimationFrame(glide);
  };

  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('pointerleave', () => {
    if (!dragging) el.style.setProperty('--glow-op', '0.28');
  });
}

const instances: GlassInst[] = [];

export function cleanupGlass(): void {
  while (instances.length) {
    instances.pop()?.destroy();
  }
}

export function initGlass(): void {
  cleanupGlass();
  const tier = resolveTier();
  document.documentElement.dataset.glass = tier;

  // 全档位（包括手机端与 blur/solid 档）均启用弹性果冻按压
  document.querySelectorAll<HTMLElement>('[data-jelly], .btn').forEach(attachJelly);

  // 透镜拖拽与高光追踪（桌面视口）
  document.querySelectorAll<HTMLElement>('[data-lens]').forEach((el) => {
    attachDrag(el);
    if (tier === 'full' && !failed) {
      try {
        instances.push(makeGlass(el));
      } catch {
        failed = true;
        cleanupGlass();
        document.documentElement.dataset.glass = 'blur';
      }
    }
  });

  if (!mediaBound) {
    mediaBound = true;
    matchMedia('(prefers-reduced-transparency: reduce)').addEventListener('change', () => {
      reinitGlass();
    });
  }
}

export function reinitGlass(): void {
  initGlass();
}
