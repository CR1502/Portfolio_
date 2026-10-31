/** Shared camera, not shared render loops. Renderers wake only when needed. */
export const cameraPose = { dolly: 0, orbit: 0, focus: 0 };
export const parallax = { x: 0, y: 0 };
const listeners = new Set<() => void>();
export function publishSceneMotion() {
  listeners.forEach((listener) => listener());
}
export function subscribeSceneMotion(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function setParallax(x: number, y: number) {
  parallax.x = Math.max(-0.5, Math.min(0.5, x));
  parallax.y = Math.max(-0.5, Math.min(0.5, y));
  publishSceneMotion();
}
