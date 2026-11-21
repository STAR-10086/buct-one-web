/* 主题三态 + 玻璃三档（PLAN §6.5） */
export type ThemeMode = 'auto' | 'light' | 'dark';
export type GlassMode = 'auto' | 'full' | 'blur' | 'solid';
const THEME_KEY = 'buctone.theme';
const GLASS_KEY = 'buctone.glass';
let themeMediaBound = false;

export function readTheme(): ThemeMode {
  const v = localStorage.getItem(THEME_KEY);
  return v === 'light' || v === 'dark' ? v : 'auto';
}
export function applyTheme(mode: ThemeMode): void {
  const dark = mode === 'dark' || (mode === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}
export function cycleTheme(): ThemeMode {
  const order: ThemeMode[] = ['auto', 'light', 'dark'];
  const next = order[(order.indexOf(readTheme()) + 1) % 3];
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
  return next;
}
export function readGlass(): GlassMode {
  const v = localStorage.getItem(GLASS_KEY);
  return v === 'full' || v === 'blur' || v === 'solid' ? v : 'auto';
}
export function cycleGlass(): GlassMode {
  const order: GlassMode[] = ['auto', 'full', 'blur', 'solid'];
  const next = order[(order.indexOf(readGlass()) + 1) % 4];
  localStorage.setItem(GLASS_KEY, next);
  document.documentElement.dataset.glassChoice = next;
  return next;
}
export function initThemeControls(): void {
  applyTheme(readTheme());
  if (!themeMediaBound) {
    themeMediaBound = true;
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (readTheme() === 'auto') applyTheme('auto');
    });
  }
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((btn) => {
    const label = () => {
      const m = readTheme();
      btn.setAttribute('aria-label', '主题：' + (m === 'auto' ? '跟随系统' : m === 'light' ? '浅色' : '深色'));
      btn.dataset.mode = m;
    };
    label();
    if (btn.dataset.themeBound === '1') return;
    btn.dataset.themeBound = '1';
    btn.addEventListener('click', () => {
      cycleTheme();
      label();
    });
  });
}
