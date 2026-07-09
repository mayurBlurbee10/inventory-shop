import {
  argbFromHex,
  hexFromArgb,
  themeFromSourceColor,
} from "@material/material-color-utilities";

const toneKeys = ["0", "10", "20", "30", "40", "50", "60", "70", "80", "90", "95", "99", "100"];

export const defaultPrimary = "#3B82F6";
export const GRADIENT_DEFAULT_ANGLE = 135;

export const GRADIENT_DIRECTIONS = [
  { key: "to-right", label: "Left → Right", angle: 90 },
  { key: "to-left", label: "Right → Left", angle: 270 },
  { key: "to-bottom", label: "Top → Bottom", angle: 180 },
  { key: "to-top", label: "Bottom → Top", angle: 0 },
  { key: "to-bottom-right", label: "Diagonal ↘", angle: 135 },
  { key: "to-bottom-left", label: "Diagonal ↙", angle: 225 },
  { key: "to-top-right", label: "Diagonal ↗", angle: 45 },
  { key: "to-top-left", label: "Diagonal ↖", angle: 315 },
];

export const resolveGradientAngle = (angle) => {
  const numericAngle = Number(angle);
  if (Number.isFinite(numericAngle)) return numericAngle;

  const direction = GRADIENT_DIRECTIONS.find((item) => item.key === angle);
  return direction?.angle ?? GRADIENT_DEFAULT_ANGLE;
};

export const isValidHex = (value) => /^#[0-9A-F]{6}$/i.test(value);

export const isGradientValue = (value) =>
  typeof value === "string" && value.trim().startsWith("linear-gradient");

export const buildLinearGradient = (
  startColor,
  endColor,
  angle = GRADIENT_DEFAULT_ANGLE,
) => `linear-gradient(${angle}deg, ${startColor} 0%, ${endColor} 100%)`;

const extractHexColorsFromGradient = (gradient) => {
  const matches = gradient.match(/#[0-9A-Fa-f]{6}/g) || [];
  return matches;
};

const extractAngleFromGradient = (gradient) => {
  const match = gradient.match(/linear-gradient\(\s*(-?\d+(?:\.\d+)?)deg/i);
  return match ? Number(match[1]) : GRADIENT_DEFAULT_ANGLE;
};

export const parsePrimaryColor = (input) => {
  if (!input) {
    return {
      isGradient: false,
      solidHex: defaultPrimary,
      gradient: null,
      raw: defaultPrimary,
    };
  }

  if (typeof input === "object") {
    if (input.type === "gradient" && input.start && input.end) {
      const gradient = buildLinearGradient(
        input.start,
        input.end,
        input.angle ?? GRADIENT_DEFAULT_ANGLE,
      );
      return {
        isGradient: true,
        solidHex: input.start,
        gradient,
        raw: gradient,
        start: input.start,
        end: input.end,
        angle: input.angle ?? GRADIENT_DEFAULT_ANGLE,
      };
    }

    if (input.primary) {
      return parsePrimaryColor(input.primary);
    }
  }

  const raw = String(input).trim();

  if (isGradientValue(raw)) {
    const [start, end] = extractHexColorsFromGradient(raw);
    return {
      isGradient: true,
      solidHex: start || defaultPrimary,
      gradient: raw,
      raw,
      start: start || defaultPrimary,
      end: end || start || defaultPrimary,
      angle: extractAngleFromGradient(raw),
    };
  }

  const hex = isValidHex(raw) ? raw : defaultPrimary;
  return {
    isGradient: false,
    solidHex: hex,
    gradient: null,
    raw: hex,
  };
};

const primaryTone = { light: 40, dark: 40 };
const primaryFgTone = { light: 100, dark: 100 };
const successTone = { light: 40, dark: 80 };
const successFgTone = { light: 100, dark: 20 };
const warningTone = { light: 80, dark: 80 };
const warningFgTone = { light: 20, dark: 20 };
const errorTone = { light: 40, dark: 80 };
const errorFgTone = { light: 100, dark: 20 };
const linkTone = { light: 40, dark: 80 };

export const hexToRgb = (hex) => {
  if (!/^#[0-9A-F]{6}$/i.test(hex)) return null;
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
};

export const hexToHslObject = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return { h: 0, s: 0, l: 0 };

  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    if (max === g) h = (b - r) / d + 2;
    if (max === b) h = (r - g) / d + 4;
    h *= 60;
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

export const hexToHsl = (hex) => {
  const { h, s, l } = hexToHslObject(hex);
  return `${h} ${s}% ${l}%`;
};

// ── Extreme-color detection ────────────────────────────────────────────────
const isNearWhite = (hex) => {
  const { l } = hexToHslObject(hex);
  return l >= 92;
};

const isNearBlack = (hex) => {
  const { l } = hexToHslObject(hex);
  return l <= 8;
};

// ── Special theme for near-white primary ──────────────────────────────────
const buildWhiteTheme = (mode, primaryHex) => {
  if (mode === "dark") {
    return {
      primary: { DEFAULT: "#000000", foreground: "#ffffff", tint: {}, shade: {} },
      success: { DEFAULT: "#4ade80", foreground: "#052e16", tint: {}, shade: {} },
      warning: { DEFAULT: "#fbbf24", foreground: "#1c0a00", tint: {}, shade: {} },
      error: { DEFAULT: "#f87171", foreground: "#1c0000", tint: {}, shade: {} },
      link: "#93c5fd",
      background: "0 0% 6%",
      surface: "0 0% 10%",
      surfaceHover: "0 0% 15%",
      foreground: "0 0% 98%",
      secondary: { DEFAULT: "hsl(0, 0%, 16%)", foreground: "hsl(0, 0%, 98%)", tint: {}, shade: {} },
      accent: { DEFAULT: "hsl(0, 0%, 20%)", foreground: "hsl(0, 0%, 98%)", tint: {}, shade: {} },
      border: "0 0% 20%",
      heading: "0 0% 98%",
      paragraph: "0 0% 70%",
      muted: "0 0% 50%",
    };
  }
  return {
    primary: { DEFAULT: primaryHex, foreground: "#111111", tint: {}, shade: {} },
    success: { DEFAULT: "#16a34a", foreground: "#ffffff", tint: {}, shade: {} },
    warning: { DEFAULT: "#d97706", foreground: "#ffffff", tint: {}, shade: {} },
    error: { DEFAULT: "#dc2626", foreground: "#ffffff", tint: {}, shade: {} },
    link: "#2563eb",
    background: "0 0% 100%",
    surface: "0 0% 96%",
    surfaceHover: "0 0% 90%",
    foreground: "0 0% 9%",
    secondary: { DEFAULT: "hsl(0, 0%, 92%)", foreground: "hsl(0, 0%, 9%)", tint: {}, shade: {} },
    accent: { DEFAULT: "hsl(0, 0%, 75%)", foreground: "hsl(0, 0%, 9%)", tint: {}, shade: {} },
    border: "0 0% 90%",
    heading: "0 0% 9%",
    paragraph: "0 0% 30%",
    muted: "0 0% 50%",
  };
};

// ── Special theme for near-black primary ──────────────────────────────────
const buildBlackTheme = (mode, primaryHex) => {
  if (mode === "dark") {
    return {
      primary: { DEFAULT: primaryHex, foreground: "#ffffff", tint: {}, shade: {} },
      success: { DEFAULT: "#4ade80", foreground: "#052e16", tint: {}, shade: {} },
      warning: { DEFAULT: "#fbbf24", foreground: "#1c0a00", tint: {}, shade: {} },
      error: { DEFAULT: "#f87171", foreground: "#1c0000", tint: {}, shade: {} },
      link: "#93c5fd",
      background: "0 0% 6%",
      surface: "0 0% 10%",
      surfaceHover: "0 0% 15%",
      foreground: "0 0% 98%",
      secondary: { DEFAULT: "hsl(0, 0%, 16%)", foreground: "hsl(0, 0%, 98%)", tint: {}, shade: {} },
      accent: { DEFAULT: "hsl(0, 0%, 20%)", foreground: "hsl(0, 0%, 98%)", tint: {}, shade: {} },
      border: "0 0% 20%",
      heading: "0 0% 98%",
      paragraph: "0 0% 70%",
      muted: "0 0% 50%",
    };
  }
  return {
    primary: {
      DEFAULT: primaryHex,
      foreground: getAccessibleForegroundHex(primaryHex),
      tint: {},
      shade: {},
    },
    success: { DEFAULT: "#16a34a", foreground: "#ffffff", tint: {}, shade: {} },
    warning: { DEFAULT: "#d97706", foreground: "#ffffff", tint: {}, shade: {} },
    error: { DEFAULT: "#dc2626", foreground: "#ffffff", tint: {}, shade: {} },
    link: "#2563eb",
    background: "0 0% 98%",
    surface: "0 0% 95%",
    surfaceHover: "0 0% 90%",
    foreground: "0 0% 9%",
    secondary: { DEFAULT: "hsl(0, 0%, 90%)", foreground: "hsl(0, 0%, 9%)", tint: {}, shade: {} },
    accent: { DEFAULT: "hsl(0, 0%, 85%)", foreground: "hsl(0, 0%, 9%)", tint: {}, shade: {} },
    border: "0 0% 90%",
    heading: "0 0% 9%",
    paragraph: "0 0% 30%",
    muted: "0 0% 50%",
  };
};

// ── Existing helpers ───────────────────────────────────────────────────────
const darkenHexBy = (hex, amount) => {
  const { h, s, l } = hexToHslObject(hex);
  const darkenedL = Math.max(0, l - amount);
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = darkenedL / 100;
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (sNorm === 0) {
    r = g = b = lNorm;
  } else {
    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;
    r = hue2rgb(p, q, hNorm + 1 / 3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1 / 3);
  }
  const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const darkenIfBright = (hex) => {
  const { l } = hexToHslObject(hex);
  if (l <= 60) return hex;
  return darkenHexBy(hex, 10);
};

export const buildProcessedGradient = (
  startColor,
  endColor,
  mode = "light",
  angle = GRADIENT_DEFAULT_ANGLE,
) => {
  const start = isValidHex(startColor) ? startColor : defaultPrimary;
  const end = isValidHex(endColor) ? endColor : start;
  const gradient = buildLinearGradient(start, end, angle);

  return {
    start,
    end,
    gradient,
    raw: gradient,
    angle,
  };
};

const normalizeGradientForMode = (parsedPrimary, mode = "light") => {
  if (!parsedPrimary?.isGradient) return parsedPrimary;

  const processed = buildProcessedGradient(
    parsedPrimary.start || defaultPrimary,
    parsedPrimary.end || parsedPrimary.start || defaultPrimary,
    mode,
    parsedPrimary.angle ?? GRADIENT_DEFAULT_ANGLE,
  );

  return {
    ...parsedPrimary,
    start: processed.start,
    end: processed.end,
    solidHex: processed.start,
    angle: processed.angle,
    gradient: processed.gradient,
    raw: processed.gradient,
  };
};
const isGrayColor = (hex) => {
  const rgb = hexToRgb(hex);

  if (!rgb) return false;

  return (
    Math.abs(rgb.r - rgb.g) < 15 &&
    Math.abs(rgb.g - rgb.b) < 15 &&
    Math.abs(rgb.r - rgb.b) < 15
  );
};
const buildNeutralTokensWithHue = (hue, mode) => {
  const h = Math.round(((hue % 360) + 360) % 360);
  const t = (sat, light) => `${h} ${sat}% ${light}%`;

  if (mode === "dark") {
    return {
      background: t(10, 6),
      surface: t(10, 10),
      surfaceHover: t(10, 15),
      foreground: t(6, 98),
      secondary: t(8, 16),
      secondaryFg: t(6, 98),
      accent: t(8, 20),
      accentFg: t(6, 98),
      border: t(8, 20),
      heading: t(6, 98),
      paragraph: t(6, 70),
      muted: t(6, 50),
    };
  }

  return {
    background: t(12, 97),
    surface: t(10, 94),
    surfaceHover: t(10, 90),
    foreground: t(6, 9),
    secondary: t(9, 90),
    secondaryFg: t(6, 9),
    accent: t(9, 86),
    accentFg: t(6, 9),
    border: t(8, 90),
    heading: t(6, 9),
    paragraph: t(6, 28),
    muted: t(6, 45),
  };
};

const averageHue = (h1, h2) => {
  const toRad = (hue) => (hue * Math.PI) / 180;
  const x = Math.cos(toRad(h1)) + Math.cos(toRad(h2));
  const y = Math.sin(toRad(h1)) + Math.sin(toRad(h2));

  if (Math.abs(x) < 1e-6 && Math.abs(y) < 1e-6) {
    return h1;
  }

  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

const rgbToHex = ({ r, g, b }) => {
  const toHex = (value) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

const blendHexMidpoint = (startHex, endHex) => {
  const start = hexToRgb(startHex);
  const end = hexToRgb(endHex);

  if (!start || !end) {
    return isValidHex(startHex) ? startHex : defaultPrimary;
  }

  return rgbToHex({
    r: (start.r + end.r) / 2,
    g: (start.g + end.g) / 2,
    b: (start.b + end.b) / 2,
  });
};

const buildNeutralTokensFromGradient = (startHex, endHex, mode) => {
  const start = isValidHex(startHex) ? startHex : defaultPrimary;
  const end = isValidHex(endHex) ? endHex : start;
  const { h: startHue } = hexToHslObject(start);
  const { h: endHue } = hexToHslObject(end);

  return buildNeutralTokensWithHue(averageHue(startHue, endHue), mode);
};

const buildNeutralTokens = (primaryHex, mode) => {
  const { h } = hexToHslObject(primaryHex);
  return buildNeutralTokensWithHue(h, mode);
};

const getTone = (palette, tone) => {
  return hexFromArgb(palette.tone(Number(tone)));
};

const buildToneObject = (palette, defaultTone, foregroundTone) => {
  const tint = {};
  const shade = {};

  toneKeys.forEach((tone) => {
    const color = getTone(palette, tone);
    if (Number(tone) >= 50) {
      tint[tone] = color;
    } else {
      shade[tone] = color;
    }
  });

  return {
    DEFAULT: getTone(palette, defaultTone),
    foreground: getTone(palette, foregroundTone),
    tint,
    shade,
  };
};

const FOREGROUND_LIGHT = "#ffffff";
const FOREGROUND_DARK = "#111111";

// White, off-white, and gray shades → black text
const isWhiteOrGrayShade = (hex) => {
  const { s, l } = hexToHslObject(hex);

  if (l >= 75) return true;
  if (s <= 18 && l >= 30) return true;

  return false;
};

export const getAccessibleForegroundHex = (backgroundHex) => {
  const normalizedBg = isValidHex(backgroundHex) ? backgroundHex : defaultPrimary;
  return isWhiteOrGrayShade(normalizedBg) ? FOREGROUND_DARK : FOREGROUND_LIGHT;
};

export const getAccessibleForegroundForStops = (stops) => {
  const normalizedStops = stops.filter(isValidHex);

  if (normalizedStops.length === 0) {
    return getAccessibleForegroundHex(defaultPrimary);
  }

  if (normalizedStops.every(isWhiteOrGrayShade)) {
    return FOREGROUND_DARK;
  }

  return FOREGROUND_LIGHT;
};

const getAccessibleForegroundHsl = (backgroundHex) =>
  hexToHsl(getAccessibleForegroundHex(backgroundHex));

const resolvePrimaryForegroundHsl = (parsedPrimary, materialPrimaryHex) => {
  if (parsedPrimary?.isGradient) {
    const stops = [parsedPrimary.start, parsedPrimary.end].filter(isValidHex);

    if (stops.length === 0) {
      return getAccessibleForegroundHsl(materialPrimaryHex);
    }

    return hexToHsl(getAccessibleForegroundForStops(stops));
  }

  const sourceHex = isValidHex(materialPrimaryHex)
    ? materialPrimaryHex
    : parsedPrimary?.solidHex || defaultPrimary;

  return getAccessibleForegroundHsl(sourceHex);
};

// ── Main theme generator ───────────────────────────────────────────────────
export const generateMaterialThemeFromPrimary = (
  primaryHex,
  mode = "light",
  { gradientStart, gradientEnd } = {},
) => {
  const hasGradientStops =
    isValidHex(gradientStart) && isValidHex(gradientEnd);

  const validPrimary = hasGradientStops
    ? blendHexMidpoint(gradientStart, gradientEnd)
    : /^#[0-9A-F]{6}$/i.test(primaryHex)
      ? primaryHex
      : defaultPrimary;

  // Short-circuit for near-white and near-black inputs FIRST
  if (isNearWhite(validPrimary)) {
    return buildWhiteTheme(mode, validPrimary);
  }
  if (isNearBlack(validPrimary)) {
    return buildBlackTheme(mode, validPrimary);
  }

  if (isGrayColor(validPrimary)) {
    return buildBlackTheme(mode, mode === "dark" ? "#000000" : validPrimary);
  }
  const adjustedPrimary =
    mode === "dark" ? darkenIfBright(validPrimary) : validPrimary;

  const materialTheme = themeFromSourceColor(argbFromHex(adjustedPrimary));
  const neutral = hasGradientStops
    ? buildNeutralTokensFromGradient(gradientStart, gradientEnd, mode)
    : buildNeutralTokens(validPrimary, mode);
  const palettes = {
    primary: materialTheme.palettes.primary,
    error: materialTheme.palettes.error,
  };

  const primaryDefault = getTone(palettes.primary, primaryTone[mode]);
  const primaryFg = getTone(palettes.primary, primaryFgTone[mode]);
  const successDefault = getTone(palettes.primary, successTone[mode]);
  const successFg = getTone(palettes.primary, successFgTone[mode]);
  const warningDefault = getTone(palettes.error, warningTone[mode]);
  const warningFg = getTone(palettes.error, warningFgTone[mode]);
  const errorDefault = getTone(palettes.error, errorTone[mode]);
  const errorFg = getTone(palettes.error, errorFgTone[mode]);
  const linkColor = getTone(palettes.primary, linkTone[mode]);

  const primaryPalette = buildToneObject(
    palettes.primary,
    primaryTone[mode],
    primaryFgTone[mode]
  );

  primaryPalette.foreground = resolvePrimaryForegroundHsl(
    { isGradient: false, solidHex: validPrimary },
    primaryDefault,
  );

  return {
    primary: primaryPalette,
    success: { DEFAULT: successDefault, foreground: successFg, tint: {}, shade: {} },
    warning: { DEFAULT: warningDefault, foreground: warningFg, tint: {}, shade: {} },
    error: { DEFAULT: errorDefault, foreground: errorFg, tint: {}, shade: {} },
    link: linkColor,

    background: neutral.background,
    surface: neutral.surface,
    surfaceHover: neutral.surfaceHover,
    foreground: neutral.foreground,

    secondary: { DEFAULT: neutral.secondary, foreground: neutral.secondaryFg, tint: {}, shade: {} },
    accent: { DEFAULT: neutral.accent, foreground: neutral.accentFg, tint: {}, shade: {} },

    border: neutral.border,
    heading: neutral.heading,
    paragraph: neutral.paragraph,
    muted: neutral.muted,
  };
};

// ── toHsl — handles hex, plain HSL strings, and hsl(...) wrappers ──────────
const toHsl = (value) => {
  if (!value) return "0 0% 0%";
  if (typeof value === "string" && value.startsWith("#")) return hexToHsl(value);
  // Strip hsl(...) wrapper if present (used by white/black theme objects)
  if (typeof value === "string" && value.startsWith("hsl(")) {
    return value.replace(/^hsl\((.+)\)$/, "$1");
  }
  return value;
};

const buildPrimarySurfaceVars = (materialTheme, parsedPrimary, mode = "light") => {
  const primaryHsl = toHsl(materialTheme.primary.DEFAULT);
  const solidBg = `hsl(${primaryHsl})`;
  const normalizedPrimary = parsedPrimary?.isGradient
    ? normalizeGradientForMode(parsedPrimary, mode)
    : parsedPrimary;
  const isGradient = Boolean(
    normalizedPrimary?.isGradient && normalizedPrimary.gradient,
  );
  const primaryForeground = resolvePrimaryForegroundHsl(
    normalizedPrimary,
    materialTheme.primary.DEFAULT,
  );

  return {
    primary: primaryHsl,
    "primary-foreground": primaryForeground,
    "primary-bg": isGradient ? normalizedPrimary.gradient : solidBg,
    "primary-solid": solidBg,
    "primary-is-gradient": isGradient ? "1" : "0",
    ...(isGradient ? { "primary-gradient": normalizedPrimary.gradient } : {}),
  };
};

export const buildAppliedTheme = (
  materialTheme,
  parsedPrimary = null,
  mode = "light",
) => {
  const primarySurface = buildPrimarySurfaceVars(
    materialTheme,
    parsedPrimary,
    mode,
  );

  return {
    // Standard Shadcn UI Variables
    background: toHsl(materialTheme.background),
    foreground: toHsl(materialTheme.foreground),

    ...primarySurface,

    secondary: toHsl(materialTheme.secondary.DEFAULT),
    "secondary-foreground": toHsl(materialTheme.secondary.foreground),

    accent: toHsl(materialTheme.surfaceHover),
    "accent-foreground": toHsl(materialTheme.heading),

    muted: toHsl(materialTheme.surfaceHover || materialTheme.muted),
    "muted-foreground": toHsl(materialTheme.paragraph),

    destructive: toHsl(materialTheme.error.DEFAULT),
    "destructive-foreground": toHsl(materialTheme.error.foreground),

    card: toHsl(materialTheme.surface),
    "card-foreground": toHsl(materialTheme.heading),

    popover: toHsl(materialTheme.surface),
    "popover-foreground": toHsl(materialTheme.heading),

    border: toHsl(materialTheme.border),
    input: toHsl(materialTheme.border),
    ring: toHsl(materialTheme.primary.DEFAULT),

    // Legacy Custom Variables (for backwards compatibility)
    surface: toHsl(materialTheme.surface),
    "surface-hover": toHsl(materialTheme.surfaceHover),
    heading: toHsl(materialTheme.heading),
    paragraph: toHsl(materialTheme.paragraph),

    success: toHsl(materialTheme.success.DEFAULT),
    "success-foreground": toHsl(materialTheme.success.foreground),
    warning: toHsl(materialTheme.warning.DEFAULT),
    "warning-foreground": toHsl(materialTheme.warning.foreground),
    error: toHsl(materialTheme.error.DEFAULT),
    "error-foreground": toHsl(materialTheme.error.foreground),
    link: toHsl(materialTheme.link),
  };
};

export const calculateTheme = (primaryColor, mode = "light") => {
  const parsed = parsePrimaryColor(primaryColor);
  const normalized = parsed.isGradient
    ? normalizeGradientForMode(parsed, mode)
    : parsed;

  const materialTheme = generateMaterialThemeFromPrimary(
    normalized.solidHex,
    mode,
    normalized.isGradient
      ? { gradientStart: normalized.start, gradientEnd: normalized.end }
      : {},
  );

  return buildAppliedTheme(materialTheme, normalized, mode);
};
