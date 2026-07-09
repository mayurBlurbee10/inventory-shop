/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Custom color wheel mapping points based on the UI specification:
// Top (0°) = Red (Hue 0°)
// Top Right (45°) = Orange (Hue 30°)
// Right (90°) = Yellow (Hue 60°)
// Bottom Right (135°) = Green (Hue 120°)
// Bottom (180°) = Cyan (Hue 180°)
// Bottom Left (225°) = Blue (Hue 240°)
// Left (270°) = Purple (Hue 280°)
// Top Left (315°) = Magenta (Hue 310°)
// Back to Red (360°) = Red (360°)
const MAPPING_POINTS = [
  { angle: 0, hue: 0 },
  { angle: 45, hue: 30 },
  { angle: 90, hue: 60 },
  { angle: 135, hue: 120 },
  { angle: 180, hue: 180 },
  { angle: 225, hue: 240 },
  { angle: 270, hue: 280 },
  { angle: 315, hue: 310 },
  { angle: 360, hue: 360 },
];

/**
 * Maps a visual angle (0 to 360 degrees, clockwise from top) to a standard HSV/HSL Hue (0 to 360).
 */
export function angleToHue(angle) {
  const normAngle = ((angle % 360) + 360) % 360;

  for (let i = 0; i < MAPPING_POINTS.length - 1; i++) {
    const p1 = MAPPING_POINTS[i];
    const p2 = MAPPING_POINTS[i + 1];

    if (normAngle >= p1.angle && normAngle <= p2.angle) {
      const ratio = (normAngle - p1.angle) / (p2.angle - p1.angle);
      return p1.hue + (p2.hue - p1.hue) * ratio;
    }
  }

  return 0;
}

/**
 * Maps a standard HSV/HSL Hue (0 to 360) back to a visual angle (0 to 360 degrees, clockwise from top).
 */
export function hueToAngle(hue) {
  const normHue = ((hue % 360) + 360) % 360;

  for (let i = 0; i < MAPPING_POINTS.length - 1; i++) {
    const p1 = MAPPING_POINTS[i];
    const p2 = MAPPING_POINTS[i + 1];

    if (normHue >= p1.hue && normHue <= p2.hue) {
      const ratio = (normHue - p1.hue) / (p2.hue - p1.hue);
      return p1.angle + (p2.angle - p1.angle) * ratio;
    }
  }

  return 0;
}

/**
 * Converts HSV to RGB.
 */
export function hsvToRgb(hsv) {
  const h = hsv.h;
  const s = hsv.s;
  const v = hsv.v;

  let r = 0, g = 0, b = 0;
  const i = Math.floor(h / 60) % 6;
  const f = h / 60 - Math.floor(h / 60);
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Converts RGB to HSV.
 */
export function rgbToHsv(rgb) {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const v = max;
  const d = max - min;

  s = max === 0 ? 0 : d / max;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s, v };
}

/**
 * Converts RGB to HSL.
 */
export function rgbToHsl(rgb) {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s, l };
}

/**
 * Converts HSL to RGB.
 */
export function hslToRgb(hsl) {
  const h = hsl.h / 360;
  const s = hsl.s;
  const l = hsl.l;

  let r = 0, g = 0, b = 0;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Converts RGB to HEX.
 */
export function rgbToHex(rgb) {
  const rHex = rgb.r.toString(16).padStart(2, '0');
  const gHex = rgb.g.toString(16).padStart(2, '0');
  const bHex = rgb.b.toString(16).padStart(2, '0');
  return `#${rHex}${gHex}${bHex}`.toUpperCase();
}

/**
 * Converts HEX to RGB.
 */
export function hexToRgb(hex) {
  const cleanHex = hex.trim().replace(/^#/, '');
  if (cleanHex.length !== 3 && cleanHex.length !== 6) {
    return null;
  }

  let fullHex = cleanHex;
  if (cleanHex.length === 3) {
    fullHex = cleanHex.split('').map(char => char + char).join('');
  }

  const num = parseInt(fullHex, 16);
  if (isNaN(num)) {
    return null;
  }

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Blends a base RGB color according to the tint-shade-ring value `t`.
 * t = 0: Pure Black (HSL L = 0)
 * t = 0.5: Exact Base Color (HSL L = base hsl.l)
 * t = maxLightness: Center Lightness (white/gray, HSL L = maxLightness)
 */
export function blendTintShade(baseRgb, t, maxLightness = 1.0) {
  const hsl = rgbToHsl(baseRgb);

  if (t <= 0.5) {
    // Shade (blend from black L = 0 to exact base color lightness hsl.l)
    const factor = t / 0.5;
    const L = factor * hsl.l;
    return hslToRgb({ h: hsl.h, s: hsl.s, l: L });
  } else {
    // Tint (blend from base color lightness hsl.l to center/max lightness)
    if (maxLightness <= 0.5) {
      return hslToRgb({ h: hsl.h, s: hsl.s, l: hsl.l });
    }
    const factor = Math.min(1.0, (t - 0.5) / (maxLightness - 0.5));
    const L = hsl.l + factor * (maxLightness - hsl.l);
    return hslToRgb({ h: hsl.h, s: hsl.s, l: L });
  }
}

/**
 * Blends a base RGB color according to the tint-shade-ring value `t` for visual rendering,
 * capping the maximum lightness at 92% (0.92) so the ring doesn't disappear on white backgrounds,
 * and capping the middle lightness at 0.5 so that it doesn't peak or glitch on light colors.
 */
export function blendTintShadeVisual(baseRgb, t, maxLightness = 1.0) {
  const hsl = rgbToHsl(baseRgb);
  
  // Cap visual base lightness at 0.5 (just like standard pure color in HSL)
  // to avoid a peak of white in the middle of the slider
  const visualBaseL = Math.min(0.5, hsl.l);
  
  if (t <= 0.5) {
    // Shade (blend from black to visual base color)
    const factor = t / 0.5;
    const L = factor * visualBaseL;
    return hslToRgb({ h: hsl.h, s: hsl.s, l: L });
  } else {
    // Tint (blend from visual base color to capped light gray/color)
    if (maxLightness <= 0.5) {
      return hslToRgb({ h: hsl.h, s: hsl.s, l: visualBaseL });
    }
    
    // We cap the maximum visual lightness at 92% (0.92) so the white/gray parts don't disappear into pure white.
    const visualMaxLightness = Math.min(0.92, maxLightness);
    
    const factor = Math.min(1.0, (t - 0.5) / (maxLightness - 0.5));
    // Non-linear power scaling (power = 1.5) to keep the transition smooth
    const adjustedFactor = Math.pow(factor, 1.5);
    
    const L = visualBaseL + adjustedFactor * (visualMaxLightness - visualBaseL);
    return hslToRgb({ h: hsl.h, s: hsl.s, l: L });
  }
}

/**
 * Generates an HSV color wheel's color at coordinate (x, y) relative to the center.
 * R is the radius of the wheel.
 */
export function getWheelColor(x, y, R) {
  const distance = Math.sqrt(x * x + y * y);
  const r_ratio = Math.min(1, distance / R);

  // Angle clockwise from the top
  const angle = (Math.atan2(x, -y) * 180 / Math.PI + 360) % 360;
  const h = angleToHue(angle);

  // Saturation decreases towards the center
  const s = r_ratio;

  // Make the color wheel value 1.0 everywhere so that the center of the wheel is pure white (s=0, v=1)
  const v = 1.0;

  return { h, s, v };
}

/**
 * Maps any HSV color back to coordinates and ringT for the circular color picker.
 */
export function colorToState(targetHsv, R = 139) {
  // Convert target HSV to HSL to get clean, independent lightness and saturation mapping
  const rgb = hsvToRgb(targetHsv);
  const hsl = rgbToHsl(rgb);

  // 1. Map Hue back to angle
  const angleDeg = hueToAngle(hsl.h);
  const angleRad = (angleDeg * Math.PI) / 180;

  // 2. Map HSL Saturation to distance from center (radius = 139)
  const dist = hsl.s * R;
  const x = dist * Math.sin(angleRad);
  const y = -dist * Math.cos(angleRad);

  // 3. Map HSL Lightness directly to ringT (0 to 1)
  const ringT = hsl.l;

  return { x, y, ringT };
}

export const BASE_COLORS = [
  { r: 255, g: 0, b: 0 },       // Red (50% 0)
  { r: 255, g: 191, b: 0 },     // Yellow-Orange (85.35% 14.64%)
  { r: 128, g: 255, b: 0 },     // Yellow-Green (100% 50%)
  { r: 0, g: 255, b: 64 },      // Green (85.35% 85.35%)
  { r: 0, g: 255, b: 255 },     // Cyan (50% 100%)
  { r: 0, g: 64, b: 255 },      // Blue (14.64% 85.35%)
  { r: 128, g: 0, b: 255 },     // Violet (0% 50%)
  { r: 255, g: 0, b: 191 },     // Magenta (14.64% 14.64%)
];

export const STOPS = [
  { stop: 0.0, pureWeight: 1.0, alpha: 1.0 },
  { stop: 0.2, pureWeight: 0.9, alpha: 0.8 },
  { stop: 0.4, pureWeight: 0.8, alpha: 0.6 },
  { stop: 0.6, pureWeight: 0.6, alpha: 0.4 },
  { stop: 0.8, pureWeight: 0.3, alpha: 0.2 },
  { stop: 1.0, pureWeight: 0.0, alpha: 0.0 },
];

export function getGradientCenter(index, radius) {
  const angleRad = (index * 45 - 90) * Math.PI / 180;
  return {
    x: radius + radius * Math.cos(angleRad),
    y: radius + radius * Math.sin(angleRad),
  };
}

export function getStopColor(baseColor, maxLightness, pureWeight, alpha) {
  const centerL = maxLightness * 255;
  const r = Math.round(baseColor.r * pureWeight + centerL * (1 - pureWeight));
  const g = Math.round(baseColor.g * pureWeight + centerL * (1 - pureWeight));
  const b = Math.round(baseColor.b * pureWeight + centerL * (1 - pureWeight));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function calculateWheelColor(x, y, maxLightness) {
  const WHEEL_RADIUS = 139;
  const centerL = maxLightness * 255;
  let r = centerL;
  let g = centerL;
  let b = centerL;

  // We blend the 8 gradients from bottom to top (7 down to 0)
  for (let k = 7; k >= 0; k--) {
    const baseColor = BASE_COLORS[k];
    
    // Gradient center relative to wheel center (0,0)
    const angleRad = (k * 45 - 90) * Math.PI / 180;
    const gcx = WHEEL_RADIUS * Math.cos(angleRad);
    const gcy = WHEEL_RADIUS * Math.sin(angleRad);
    
    // Distance from point to gradient center
    const dk = Math.sqrt((x - gcx) * (x - gcx) + (y - gcy) * (y - gcy));
    
    // Normalize distance to radius WHEEL_RADIUS
    const u = Math.min(1, dk / WHEEL_RADIUS);
    
    // Interpolate alpha and pureWeight based on STOPS
    let alpha = 0;
    let pureWeight = 0;
    
    if (u <= 0.2) {
      const t = u / 0.2;
      alpha = 1.0 - t * 0.2;
      pureWeight = 1.0 - t * 0.1;
    } else if (u <= 0.4) {
      const t = (u - 0.2) / 0.2;
      alpha = 0.8 - t * 0.2;
      pureWeight = 0.9 - t * 0.1;
    } else if (u <= 0.6) {
      const t = (u - 0.4) / 0.2;
      alpha = 0.6 - t * 0.2;
      pureWeight = 0.8 - t * 0.2;
    } else if (u <= 0.8) {
      const t = (u - 0.6) / 0.2;
      alpha = 0.4 - t * 0.2;
      pureWeight = 0.6 - t * 0.3;
    } else if (u <= 1.0) {
      const t = (u - 0.8) / 0.2;
      alpha = 0.2 - t * 0.2;
      pureWeight = 0.3 - t * 0.3;
    }
    
    // Interpolated gradient color at this distance
    const gr = baseColor.r * pureWeight + centerL * (1 - pureWeight);
    const gg = baseColor.g * pureWeight + centerL * (1 - pureWeight);
    const gb = baseColor.b * pureWeight + centerL * (1 - pureWeight);
    
    // Standard alpha blend: C_out = C_src * alpha + C_out * (1 - alpha)
    r = gr * alpha + r * (1 - alpha);
    g = gg * alpha + g * (1 - alpha);
    b = gb * alpha + b * (1 - alpha);
  }

  return {
    r: Math.max(0, Math.min(255, Math.round(r))),
    g: Math.max(0, Math.min(255, Math.round(g))),
    b: Math.max(0, Math.min(255, Math.round(b))),
  };
}

/**
 * Generates beautiful harmonic palettes for a given hex color.
 */
export function generateHarmonicPalettes(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return [];

  const hsv = rgbToHsv(rgb);

  // Helper to construct hex from HSV
  const makeHex = (h, s, v) => {
    const r = hsvToRgb({ h: (h + 360) % 360, s, v });
    return rgbToHex(r);
  };

  return [
    {
      name: 'Monochromatic',
      colors: [
        makeHex(hsv.h, hsv.s * 0.3, Math.min(1, hsv.v * 1.3)),
        makeHex(hsv.h, hsv.s * 0.6, Math.min(1, hsv.v * 1.1)),
        hex,
        makeHex(hsv.h, hsv.s, Math.max(0.1, hsv.v * 0.7)),
        makeHex(hsv.h, Math.min(1, hsv.s * 1.2), Math.max(0.1, hsv.v * 0.4)),
      ],
    },
    {
      name: 'Analogous',
      colors: [
        makeHex(hsv.h - 30, hsv.s, hsv.v),
        makeHex(hsv.h - 15, hsv.s, hsv.v),
        hex,
        makeHex(hsv.h + 15, hsv.s, hsv.v),
        makeHex(hsv.h + 30, hsv.s, hsv.v),
      ],
    },
    {
      name: 'Complementary',
      colors: [
        hex,
        makeHex(hsv.h, hsv.s * 0.7, hsv.v * 0.8),
        makeHex(hsv.h + 180, hsv.s, hsv.v),
        makeHex(hsv.h + 180, hsv.s * 0.7, hsv.v * 0.8),
        makeHex(hsv.h + 180, hsv.s * 0.4, Math.min(1, hsv.v * 1.2)),
      ],
    },
    {
      name: 'Triadic',
      colors: [
        makeHex(hsv.h - 120, hsv.s, hsv.v),
        hex,
        makeHex(hsv.h + 120, hsv.s, hsv.v),
        makeHex(hsv.h - 120, hsv.s * 0.7, hsv.v * 0.8),
        makeHex(hsv.h + 120, hsv.s * 0.7, hsv.v * 0.8),
      ],
    },
    {
      name: 'Split Complementary',
      colors: [
        makeHex(hsv.h - 150, hsv.s, hsv.v),
        hex,
        makeHex(hsv.h + 150, hsv.s, hsv.v),
        makeHex(hsv.h - 150, hsv.s * 0.7, hsv.v * 0.8),
        makeHex(hsv.h + 150, hsv.s * 0.7, hsv.v * 0.8),
      ],
    },
  ];
}
