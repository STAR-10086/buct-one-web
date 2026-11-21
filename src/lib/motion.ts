/* 页面交互动效引擎：滚动阶梯入场、卡片镜面高光、Hero 3D 视差、FAQ 平滑展开、截图 Lightbox */

let revealObserver: IntersectionObserver | null = null;
const revealTimers: number[] = [];
let lightboxKeyBound = false;
let currentLightboxCleanup: (() => void) | null = null;

function isReducedMotion(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isFinePointerHover(): boolean {
  return matchMedia('(hover: hover) and (pointer: fine)').matches;
}

export function cleanupMotion(): void {
  revealObserver?.disconnect();
  revealObserver = null;
  while (revealTimers.length) {
    clearTimeout(revealTimers.pop());
  }
  currentLightboxCleanup?.();
  currentLightboxCleanup = null;
}

/* 1. 滚动阶梯入场 */
export function initReveal(): void {
  document.documentElement.classList.add('js-ready');
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (!els.length) return;

  if (isReducedMotion() || !('IntersectionObserver' in window)) {
    els.forEach((el) => {
      el.dataset.reveal = 'done';
    });
    return;
  }

  const revealEl = (el: HTMLElement, delayMs: number) => {
    if (el.dataset.reveal === 'in' || el.dataset.reveal === 'done') return;
    el.style.setProperty('--reveal-delay', `${delayMs}ms`);
    el.dataset.reveal = 'in';
    const t = window.setTimeout(() => {
      el.dataset.reveal = 'done';
      el.style.removeProperty('--reveal-delay');
    }, delayMs + 580);
    revealTimers.push(t);
  };

  const vh = window.innerHeight || 800;
  const immediate: HTMLElement[] = [];
  const pending: HTMLElement[] = [];

  for (const el of els) {
    if (el.dataset.reveal === 'done') continue;
    const rect = el.getBoundingClientRect();
    if (rect.bottom < 0) {
      el.dataset.reveal = 'done';
    } else if (rect.top < vh * 0.94) {
      immediate.push(el);
    } else {
      pending.push(el);
    }
  }

  if (immediate.length) {
    requestAnimationFrame(() => {
      immediate.forEach((el, idx) => revealEl(el, Math.min(idx * 50, 250)));
    });
  }

  if (!pending.length) return;

  revealObserver = new IntersectionObserver(
    (entries) => {
      let batchIdx = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const target = entry.target as HTMLElement;
        revealEl(target, Math.min(batchIdx * 45, 270));
        batchIdx++;
        revealObserver?.unobserve(target);
      }
    },
    { threshold: 0.06, rootMargin: '0px 0px -28px 0px' },
  );

  pending.forEach((el) => revealObserver?.observe(el));
}

/* 2. 卡片鼠标跟随镜面高光 */
export function initSpotlight(): void {
  if (!isFinePointerHover() || isReducedMotion()) return;
  document.querySelectorAll<HTMLElement>('[data-spotlight]').forEach((el) => {
    if (el.dataset.spotBound === '1') return;
    el.dataset.spotBound = '1';
    let raf = 0;
    let cx = 0;
    let cy = 0;
    el.addEventListener('pointermove', (e) => {
      cx = e.clientX;
      cy = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        el.style.setProperty('--mx', `${(cx - rect.left).toFixed(1)}px`);
        el.style.setProperty('--my', `${(cy - rect.top).toFixed(1)}px`);
      });
    });
  });
}

/* 3. Hero 手机壳 3D 指针视差倾斜 */
export function initHeroTilt(): void {
  if (!isFinePointerHover() || isReducedMotion()) return;
  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
    if (el.dataset.tiltBound === '1') return;
    el.dataset.tiltBound = '1';
    let raf = 0;
    let cx = 0;
    let cy = 0;

    el.addEventListener('pointerenter', () => {
      el.style.transition = 'transform 120ms ease-out';
    });

    el.addEventListener('pointermove', (e) => {
      cx = e.clientX;
      cy = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const nx = (cx - rect.left) / rect.width - 0.5;
        const ny = (cy - rect.top) / rect.height - 0.5;
        const rx = (-ny * 8).toFixed(2);
        const ry = (nx * 10).toFixed(2);
        el.style.transform = `perspective(960px) rotateX(${rx}deg) rotateY(${ry}deg) translate3d(0, -4px, 0)`;
      });
    });

    el.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf);
      raf = 0;
      el.style.transition = 'transform 460ms cubic-bezier(0.2, 0.9, 0.3, 1.08)';
      el.style.transform = '';
    });
  });
}

/* 4. <details> FAQ / 校验说明平滑展开动画 */
export function initSmoothDetails(): void {
  document.querySelectorAll<HTMLDetailsElement>('details.faq-item, details.verify').forEach((details) => {
    if (details.dataset.detailsBound === '1') return;
    details.dataset.detailsBound = '1';
    const summary = details.querySelector('summary');
    if (!summary) return;

    let anim: Animation | null = null;
    let state: 'idle' | 'opening' | 'closing' = 'idle';

    summary.addEventListener('click', (e) => {
      if (isReducedMotion() || typeof details.animate !== 'function') return;
      e.preventDefault();
      details.style.overflow = 'hidden';

      const cs = getComputedStyle(details);
      const padV =
        parseFloat(cs.paddingTop) +
        parseFloat(cs.paddingBottom) +
        parseFloat(cs.borderTopWidth) +
        parseFloat(cs.borderBottomWidth);

      if (state === 'closing' || !details.open) {
        anim?.cancel();
        state = 'opening';
        const startH = details.offsetHeight;
        details.open = true;
        requestAnimationFrame(() => {
          const endH = details.offsetHeight;
          anim = details.animate([{ height: `${startH}px` }, { height: `${endH}px` }], {
            duration: 280,
            easing: 'cubic-bezier(0.2, 0, 0, 1)',
          });
          anim.onfinish = () => {
            state = 'idle';
            details.style.height = '';
            details.style.overflow = '';
          };
          anim.oncancel = () => {
            state = 'idle';
          };
        });
      } else {
        anim?.cancel();
        state = 'closing';
        const startH = details.offsetHeight;
        const endH = summary.offsetHeight + padV;
        anim = details.animate([{ height: `${startH}px` }, { height: `${endH}px` }], {
          duration: 230,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        });
        anim.onfinish = () => {
          state = 'idle';
          details.open = false;
          details.style.height = '';
          details.style.overflow = '';
        };
        anim.oncancel = () => {
          state = 'idle';
        };
      }
    });
  });
}

/* 5. 手机截图放大预览 Lightbox */
interface ShotItem {
  id: string;
  label: string;
  src: string;
}

export function initShotLightbox(): void {
  const figures = Array.from(document.querySelectorAll<HTMLElement>('.phone-shot[data-shot-zoom]'));
  if (!figures.length) return;

  const shots: ShotItem[] = [];
  figures.forEach((fig) => {
    const img = fig.querySelector<HTMLImageElement>('.phone-img');
    const id = fig.dataset.shot || '';
    const label = fig.dataset.shotLabel || id;
    if (!img || !id) return;
    const idx = shots.length;
    shots.push({ id, label, src: img.getAttribute('src') || `/shots/shot-${id}.webp` });

    if (fig.dataset.shotBound === '1') return;
    fig.dataset.shotBound = '1';
    fig.setAttribute('tabindex', '0');
    fig.setAttribute('role', 'button');
    fig.setAttribute('aria-label', `放大查看「${label}」截图`);

    const openAt = () => openLightbox(shots, idx);
    fig.addEventListener('click', openAt);
    fig.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openAt();
      }
    });
  });
}

function getOrCreateLightbox(): HTMLElement {
  let box = document.querySelector<HTMLElement>('.shot-lightbox');
  if (box) return box;

  box = document.createElement('div');
  box.className = 'shot-lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', '应用截图预览');
  box.innerHTML = `
    <div class="shot-lightbox-panel">
      <div class="shot-lightbox-frame">
        <img alt="" />
      </div>
      <div class="shot-lightbox-bar glass-nav edge-ring">
        <button type="button" class="shot-lightbox-btn" data-lb-prev aria-label="上一张">‹</button>
        <span class="shot-lightbox-title"></span>
        <button type="button" class="shot-lightbox-btn" data-lb-next aria-label="下一张">›</button>
        <button type="button" class="shot-lightbox-btn" data-lb-close aria-label="关闭预览">✕</button>
      </div>
    </div>
  `;
  document.body.appendChild(box);
  return box;
}

function openLightbox(shots: ShotItem[], startIndex: number): void {
  if (!shots.length) return;
  const box = getOrCreateLightbox();
  const img = box.querySelector<HTMLImageElement>('img')!;
  const title = box.querySelector<HTMLElement>('.shot-lightbox-title')!;
  const prevBtn = box.querySelector<HTMLButtonElement>('[data-lb-prev]')!;
  const nextBtn = box.querySelector<HTMLButtonElement>('[data-lb-next]')!;
  const closeBtn = box.querySelector<HTMLButtonElement>('[data-lb-close]')!;

  let idx = startIndex;
  const render = () => {
    const item = shots[idx];
    img.src = item.src;
    img.alt = item.label;
    title.textContent = `${item.label} (${idx + 1}/${shots.length})`;
    const multi = shots.length > 1;
    prevBtn.hidden = !multi;
    nextBtn.hidden = !multi;
  };

  const step = (delta: number) => {
    idx = (idx + delta + shots.length) % shots.length;
    render();
  };

  const close = () => {
    box.classList.remove('is-open');
    document.body.style.overflow = '';
    currentLightboxCleanup = null;
  };

  render();
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => box.classList.add('is-open'));
  closeBtn.focus();

  prevBtn.onclick = (e) => {
    e.stopPropagation();
    step(-1);
  };
  nextBtn.onclick = (e) => {
    e.stopPropagation();
    step(1);
  };
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    close();
  };
  box.onclick = (e) => {
    if (e.target === box) close();
  };

  if (!lightboxKeyBound) {
    lightboxKeyBound = true;
    document.addEventListener('keydown', (e) => {
      const lb = document.querySelector<HTMLElement>('.shot-lightbox.is-open');
      if (!lb) return;
      if (e.key === 'Escape') {
        lb.querySelector<HTMLButtonElement>('[data-lb-close]')?.click();
      } else if (e.key === 'ArrowLeft') {
        lb.querySelector<HTMLButtonElement>('[data-lb-prev]')?.click();
      } else if (e.key === 'ArrowRight') {
        lb.querySelector<HTMLButtonElement>('[data-lb-next]')?.click();
      }
    });
  }

  currentLightboxCleanup = close;
}
