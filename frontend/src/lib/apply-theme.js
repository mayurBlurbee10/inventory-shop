const THEME_TRANSITION_MS = 250;
const TRANSITION_CLASS = "theme-transition";

const PRIMARY_SURFACE_KEYS = [
  "primary",
  "primary-foreground",
  "primary-bg",
  "primary-solid",
  "primary-is-gradient",
  "primary-gradient",
];

function runWithThemeTransition(updateFn) {
  const root = document.documentElement;

  if (typeof document !== "undefined" && document.startViewTransition) {
    document.startViewTransition(updateFn);
    return;
  }

  root.classList.add(TRANSITION_CLASS);
  updateFn();

  requestAnimationFrame(() => {
    window.setTimeout(() => {
      root.classList.remove(TRANSITION_CLASS);
    }, THEME_TRANSITION_MS);
  });
}

function ensurePrimarySurfaceVars(root, colors) {
  const primaryHsl = colors?.primary;
  if (!primaryHsl) return;

  const solidBg = `hsl(${primaryHsl})`;

  if (!colors["primary-solid"]) {
    root.style.setProperty("--primary-solid", solidBg);
  }

  if (!colors["primary-bg"]) {
    root.style.setProperty(
      "--primary-bg",
      colors["primary-gradient"] || solidBg,
    );
  }

  if (colors["primary-is-gradient"] === undefined) {
    root.style.setProperty(
      "--primary-is-gradient",
      colors["primary-gradient"] ? "1" : "0",
    );
  }
}

function clearUnusedPrimaryGradientVars(root, colors) {
  if (colors?.["primary-is-gradient"] === "1" || colors?.["primary-gradient"]) {
    return;
  }

  root.style.removeProperty("--primary-gradient");
}

export function applyTheme(colors, { transition = false } = {}) {
  const applyColors = () => {
    const root = document.documentElement;

    Object.entries(colors).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        root.style.setProperty(`--${key}`, value);
      }
    });

    ensurePrimarySurfaceVars(root, colors);
    clearUnusedPrimaryGradientVars(root, colors);
  };

  if (transition && typeof window !== "undefined") {
    runWithThemeTransition(applyColors);
    return;
  }

  applyColors();
}

export { PRIMARY_SURFACE_KEYS };
