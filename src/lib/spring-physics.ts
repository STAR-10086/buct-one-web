/* 移植 App LiquidSpringPhysics.kt（半隐式质量-弹簧-阻尼积分）+ MotionTokens.kt 参数 */
export interface SpringState { position: number; velocity: number; }
const MAX_SUBSTEP = 1 / 120;
const MAX_FRAME_DELTA = 0.1;
export function step(state: SpringState, target: number, stiffness: number, dampingRatio: number, deltaSeconds: number): SpringState {
  const k = Math.max(stiffness, 0.001);
  const z = Math.max(dampingRatio, 0);
  const total = Math.min(Math.max(deltaSeconds, 0), MAX_FRAME_DELTA);
  if (total <= 0) return state;
  const substeps = Math.max(1, Math.ceil(total / MAX_SUBSTEP));
  const dt = total / substeps;
  const damping = 2 * z * Math.sqrt(k);
  let { position, velocity } = state;
  for (let i = 0; i < substeps; i++) {
    const a = -k * (position - target) - damping * velocity;
    velocity += a * dt;
    position += velocity * dt;
  }
  return { position, velocity };
}
export const MotionSpring = {
  liquidTap: { z: 0.62, k: 460 },
  liquidSettle: { z: 0.80, k: 420 },
  segmentedSettle: { z: 0.60, k: 400 },
  segmentedRelease: { z: 0.62, k: 480 },
  navSettle: { z: 0.60, k: 310 },
  navRelease: { z: 0.55, k: 290 },
  liquidSelectionRelease: { z: 0.72, k: 360 },
  liquidJellyRebound: { z: 0.66, k: 320 },
  liquidFollow: { z: 1, k: 1100 },
  liquidMenu: { z: 0.78, k: 520 },
  gentle: { z: 0.85, k: 50 },
  extraBouncy: { z: 0.5, k: 300 },
} as const;
export type SpringName = keyof typeof MotionSpring;
export function animateSpring(from: number, to: number, name: SpringName, onUpdate: (v: number) => void, onDone?: () => void): () => void {
  const { z, k } = MotionSpring[name];
  let state: SpringState = { position: from, velocity: 0 };
  let last = performance.now();
  let raf = 0;
  let cancelled = false;
  const tick = (now: number) => {
    if (cancelled) return;
    const dt = (now - last) / 1000; last = now;
    state = step(state, to, k, z, dt);
    onUpdate(state.position);
    if (Math.abs(state.position - to) < 0.001 && Math.abs(state.velocity) < 0.001) { onUpdate(to); onDone?.(); return; }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => { cancelled = true; cancelAnimationFrame(raf); };
}
export const springEase = (t: number): number => 1 - Math.exp(-5 * t) * Math.cos(9 * t);
