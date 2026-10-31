/**
 * The device matrix the redesign is held to. Widths are CSS pixels (layout
 * viewport), not physical pixels. `dpr` matters for raster sharpness and for
 * the 3D quality tiers; `touch` switches the expected minimum hit target.
 */
export const DEVICES = [
  // --- phones: narrowest first, because that is where layouts fail ---
  { name: 'galaxy-z-fold-folded',  w: 344,  h: 882,  dpr: 3,    touch: true,  note: 'narrowest supported width' },
  { name: 'galaxy-s24',            w: 360,  h: 780,  dpr: 3,    touch: true },
  { name: 'iphone-se-3',           w: 375,  h: 667,  dpr: 2,    touch: true,  note: 'shortest supported phone' },
  { name: 'galaxy-z-flip-cover',   w: 375,  h: 420,  dpr: 3,    touch: true,  note: 'extreme short viewport' },
  { name: 'galaxy-s24-ultra',      w: 384,  h: 824,  dpr: 3,    touch: true },
  { name: 'iphone-16',             w: 393,  h: 852,  dpr: 3,    touch: true },
  { name: 'pixel-8',               w: 412,  h: 915,  dpr: 2.625,touch: true },
  { name: 'iphone-16-pro-max',     w: 430,  h: 932,  dpr: 3,    touch: true },
  { name: 'iphone-17-pro-max',     w: 440,  h: 956,  dpr: 3,    touch: true },
  { name: 'pixel-10-pro-xl',       w: 448,  h: 992,  dpr: 3,    touch: true },

  // --- foldables unfolded: the awkward in-between widths ---
  { name: 'galaxy-z-fold-open',    w: 673,  h: 841,  dpr: 2.6,  touch: true,  note: 'tablet width, phone height' },
  { name: 'pixel-fold-open',       w: 701,  h: 841,  dpr: 2.2,  touch: true },

  // --- tablets, both orientations ---
  { name: 'ipad-mini-portrait',    w: 744,  h: 1133, dpr: 2,    touch: true },
  { name: 'ipad-mini-landscape',   w: 1133, h: 744,  dpr: 2,    touch: true },
  { name: 'ipad-pro-11-portrait',  w: 834,  h: 1194, dpr: 2,    touch: true },
  { name: 'ipad-pro-11-landscape', w: 1194, h: 834,  dpr: 2,    touch: true },
  { name: 'ipad-pro-13-portrait',  w: 1024, h: 1366, dpr: 2,    touch: true },
  { name: 'ipad-pro-13-landscape', w: 1366, h: 1024, dpr: 2,    touch: true },

  // --- laptops and desktops ---
  { name: 'macbook-air-13',        w: 1280, h: 800,  dpr: 2 },
  { name: 'laptop-1440',           w: 1440, h: 900,  dpr: 2 },
  { name: 'desktop-1080p',         w: 1920, h: 1080, dpr: 1 },
  { name: 'desktop-1440p',         w: 2560, h: 1440, dpr: 1 },
  { name: 'ultrawide',             w: 3440, h: 1440, dpr: 1,    note: 'widest supported' },
  { name: 'desktop-4k',            w: 3840, h: 2160, dpr: 2 },
];

/** Apple's minimums, as cited in accessibility.md. */
export const LIMITS = {
  minFontPx: 11,        // iOS/iPadOS minimum type size
  minTargetTouchPx: 44, // iOS/iPadOS default control size
  minTargetPointerPx: 28, // macOS default control size
};
