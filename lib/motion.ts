/**
 * Single source of truth for whether the site should reduce motion.
 *
 * The OS `prefers-reduced-motion` setting is the default, but a visitor can
 * override it with the on-page toggle — the common case being a Windows laptop
 * where "Animation effects" is off by default, which Chrome reports as
 * `prefers-reduced-motion: reduce` and which would otherwise freeze every scene.
 *
 * The decision is mirrored onto `<html data-motion="full|reduce">` (set before
 * paint by an inline script in the layout, kept in sync here) so CSS keys off
 * the same truth the JavaScript scenes do.
 */

export type MotionOverride = "on" | "off" | null;

const KEY = "motion-override";

export function getMotionOverride(): MotionOverride {
  try {
    const value = localStorage.getItem(KEY);
    return value === "on" || value === "off" ? value : null;
  } catch {
    return null;
  }
}

function osReducedMotion(): boolean {
  return (
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** The effective decision every surface — JS and CSS — must honour. */
export function isReducedMotion(): boolean {
  const override = getMotionOverride();
  if (override === "on") return false;
  if (override === "off") return true;
  return osReducedMotion();
}

/** Reflect the current decision onto the document for CSS. */
function reflect(): void {
  if (typeof document !== "undefined")
    document.documentElement.dataset.motion = isReducedMotion()
      ? "reduce"
      : "full";
}

/**
 * Persist an explicit choice and reload. A reload is the simplest correct way
 * to re-initialise every WebGL scene, Lenis/GSAP timeline and reveal observer,
 * which each decide once at mount whether to run at all.
 */
export function setMotionOverride(override: MotionOverride): void {
  try {
    if (override) localStorage.setItem(KEY, override);
    else localStorage.removeItem(KEY);
  } catch {
    /* storage can be unavailable; the reload below still re-reads the OS */
  }
  reflect();
  location.reload();
}

/**
 * Keep `data-motion` in sync when the OS setting changes mid-session and there
 * is no explicit override. Returns a cleanup function.
 */
export function initMotionSync(): () => void {
  let mql: MediaQueryList | null = null;
  try {
    mql = matchMedia("(prefers-reduced-motion: reduce)");
  } catch {
    return () => {};
  }
  const apply = () => {
    if (getMotionOverride()) return; // an explicit choice was set at load
    reflect();
  };
  mql.addEventListener("change", apply);
  return () => mql?.removeEventListener("change", apply);
}

type ChangeCallback = (event: MediaQueryListEvent) => void;

/**
 * A `MediaQueryList`-compatible view of the effective decision, so existing call
 * sites that did `matchMedia("(prefers-reduced-motion: reduce)")` only swap the
 * constructor: `.matches` and `addEventListener("change", …)` keep working, but
 * now reflect the override as well as the OS. Explicit overrides reload the page,
 * so the "change" event only needs to relay live OS changes.
 */
export function reducedMotion() {
  let osMql: MediaQueryList | null = null;
  try {
    osMql = matchMedia("(prefers-reduced-motion: reduce)");
  } catch {
    /* non-browser / unsupported */
  }
  const wrappers = new WeakMap<ChangeCallback, () => void>();
  return {
    get matches() {
      return isReducedMotion();
    },
    addEventListener(_type: "change", callback: ChangeCallback) {
      const wrapped = () =>
        callback({ matches: isReducedMotion() } as MediaQueryListEvent);
      wrappers.set(callback, wrapped);
      osMql?.addEventListener("change", wrapped);
    },
    removeEventListener(_type: "change", callback: ChangeCallback) {
      const wrapped = wrappers.get(callback);
      if (!wrapped) return;
      osMql?.removeEventListener("change", wrapped);
      wrappers.delete(callback);
    },
  };
}
