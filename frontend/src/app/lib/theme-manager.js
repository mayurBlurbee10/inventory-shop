import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { ThemeType } from "@/config/constants";
import { getUserData } from "@/lib/auth";
import { applyTheme } from "../../lib/apply-theme";
import {
  buildLinearGradient,
  calculateTheme,
  defaultPrimary,
  parsePrimaryColor,
} from "./calculateTheme";
import { getPresetPrimaryValue, themePresets } from "./theme-presets";

const RESERVED_PATH_SEGMENTS = new Set([
  "login",
  "api",
  "settings",
  "preview",
  "sharewithme",
  "esignature",
  "onboarding",
  "forgot-password",
]);

export const getPortalIdFromPath = () => {
  if (typeof window === "undefined") return null;
  const firstSegment = window.location.pathname.split("/").filter(Boolean)[0];
  if (!firstSegment || RESERVED_PATH_SEGMENTS.has(firstSegment.toLowerCase())) {
    return null;
  }
  return firstSegment;
};

export const getThemeContext = (portalIdOverride) => {
  const user = getUserData();
  const portalId =
    portalIdOverride || getPortalIdFromPath() || user?.portalId || "root";

  return { portalId };
};

export const getStoredMode = () => localStorage.getItem("mode") || "light";

const COLORS_BY_MODE_KEY = "applied-theme-colors-by-mode";

const PRIMARY_SURFACE_KEYS_FROM_THEME = [
  "primary",
  "primary-foreground",
  "primary-bg",
  "primary-solid",
  "primary-is-gradient",
  "primary-gradient",
];

const GRADIENT_NEUTRAL_KEYS_FROM_THEME = [
  "background",
  "foreground",
  "surface",
  "surface-hover",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "border",
  "input",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "secondary",
  "secondary-foreground",
  "heading",
  "paragraph",
  "ring",
];

const refreshPrimarySurfaceColors = (colors, primaryColor, mode) => {
  if (!colors) {
    return calculateTheme(primaryColor, mode);
  }

  const freshTheme = calculateTheme(primaryColor, mode);
  const merged = { ...colors };
  const isGradient = parsePrimaryColor(primaryColor).isGradient;
  const keysToMerge = isGradient
    ? [...PRIMARY_SURFACE_KEYS_FROM_THEME, ...GRADIENT_NEUTRAL_KEYS_FROM_THEME]
    : PRIMARY_SURFACE_KEYS_FROM_THEME;

  keysToMerge.forEach((key) => {
    if (freshTheme[key] !== undefined) {
      merged[key] = freshTheme[key];
    }
  });

  return merged;
};

export const buildColorsByMode = (primaryColor) => {
  const parsed = parsePrimaryColor(primaryColor);
  return {
    light: calculateTheme(parsed.raw, "light"),
    dark: calculateTheme(parsed.raw, "dark"),
  };
};

export const buildGradientPrimary = (startColor, endColor, angle) =>
  buildLinearGradient(startColor, endColor, angle);

export const resolvePrimaryColor = (value) => parsePrimaryColor(value).raw;

export const buildPresetColorsByMode = (presetKey) => {
  const preset = themePresets[presetKey];
  if (!preset) return null;
  return buildColorsByMode(getPresetPrimaryValue(preset));
};

const getStoredColorsByMode = () => {
  const stored = localStorage.getItem(COLORS_BY_MODE_KEY);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);
    if (parsed?.light && parsed?.dark) return parsed;
  } catch {
    return null;
  }

  return null;
};

const resolveColorsForMode = (themePayload, mode, primaryColor) => {
  if (themePayload?.colorsByMode?.[mode]) {
    return refreshPrimarySurfaceColors(
      themePayload.colorsByMode[mode],
      primaryColor,
      mode,
    );
  }

  if (themePayload?.colors) {
    return refreshPrimarySurfaceColors(themePayload.colors, primaryColor, mode);
  }

  return calculateTheme(primaryColor, mode);
};

const resolveColorsByMode = (themePayload, primaryColor) => {
  if (themePayload?.colorsByMode?.light && themePayload?.colorsByMode?.dark) {
    return {
      light: refreshPrimarySurfaceColors(
        themePayload.colorsByMode.light,
        primaryColor,
        "light",
      ),
      dark: refreshPrimarySurfaceColors(
        themePayload.colorsByMode.dark,
        primaryColor,
        "dark",
      ),
    };
  }

  return buildColorsByMode(primaryColor);
};

const cacheColorsByMode = (colorsByMode, mode) => {
  if (!colorsByMode) return;
  localStorage.setItem(COLORS_BY_MODE_KEY, JSON.stringify(colorsByMode));
  if (colorsByMode[mode]) {
    cacheAppliedColors(colorsByMode[mode]);
  }
};

let hasUnsavedThemePreview = false;
let previewState = null;
let loadThemePromise = null;
let loadThemeGeneration = 0;

export const USER_AUTHENTICATED_EVENT = "user-authenticated";

export const dispatchUserAuthenticated = ({ portalId } = {}) => {
  if (typeof window === "undefined" || !portalId) return;
  window.dispatchEvent(
    new CustomEvent(USER_AUTHENTICATED_EVENT, {
      detail: { portalId },
    }),
  );
};

export const setUnsavedThemePreview = (value) => {
  hasUnsavedThemePreview = value;
  if (!value) {
    previewState = null;
  }
};

export const getUnsavedThemePreview = () => hasUnsavedThemePreview;

export const getPreviewState = () => previewState;

const setPreviewState = (state) => {
  previewState = state;
};

const dispatchThemeApplied = (state) => {
  if (!state) return;
  window.dispatchEvent(new CustomEvent("theme-applied", { detail: state }));
};

const cacheCustomTheme = (primaryColor, mode, colors, colorsByMode) => {
  localStorage.setItem("theme", "custom");
  localStorage.setItem("mode", mode);
  localStorage.setItem("custom-primary", primaryColor);
  localStorage.setItem("custom-applied-theme", JSON.stringify(colors));
  cacheColorsByMode(colorsByMode, mode);
};

const cachePresetTheme = (presetKey, mode, colors, colorsByMode) => {
  localStorage.setItem("theme", presetKey);
  localStorage.setItem("mode", mode);
  if (colors) {
    localStorage.setItem("applied-theme-colors", JSON.stringify(colors));
  }
  cacheColorsByMode(colorsByMode, mode);
};

const cacheAppliedColors = (colors) => {
  if (colors) {
    localStorage.setItem("applied-theme-colors", JSON.stringify(colors));
  }
};

export const normalizeThemeRecord = (record) => {
  if (!record) return null;

  const mode = getStoredMode();
  const themePayload = record.theme || {};
  const isCustom = record.themeType === ThemeType.CUSTOM;

  if (isCustom) {
    const primaryColor = resolvePrimaryColor(
      themePayload.primaryColor || defaultPrimary,
    );
    const colorsByMode = resolveColorsByMode(themePayload, primaryColor);
    const colors = resolveColorsForMode(themePayload, mode, primaryColor);

    return {
      activeTheme: "custom",
      themeType: ThemeType.CUSTOM,
      mode,
      primaryColor,
      colors,
      colorsByMode,
      source: "db",
    };
  }

  const presetKey = themePayload.presetKey || "slate";
  const preset = themePresets[presetKey] || themePresets.slate;
  const primaryColor = getPresetPrimaryValue(preset);
  const colorsByMode = resolveColorsByMode(themePayload, primaryColor);
  const colors = resolveColorsForMode(themePayload, mode, primaryColor);

  return {
    activeTheme: presetKey,
    themeType: ThemeType.PRESET,
    mode,
    primaryColor,
    colors,
    colorsByMode,
    source: "db",
  };
};

export const applyThemeState = (state, { animated = false } = {}) => {
  if (!state?.colors) return null;

  applyTheme(state.colors, { transition: animated });
  previewState = null;

  const colorsByMode =
    state.colorsByMode || buildColorsByMode(state.primaryColor);

  if (state.themeType === ThemeType.CUSTOM || state.activeTheme === "custom") {
    cacheCustomTheme(
      state.primaryColor,
      state.mode,
      state.colors,
      colorsByMode,
    );
    return { ...state, colorsByMode };
  }

  cachePresetTheme(state.activeTheme, state.mode, state.colors, colorsByMode);
  return { ...state, colorsByMode };
};

export const loadThemeFromLocalStorage = (mode = getStoredMode()) => {
  const savedTheme = localStorage.getItem("theme") || "slate";
  const storedColorsByMode = getStoredColorsByMode();
  const storedAppliedColors = localStorage.getItem("applied-theme-colors");
  let cachedColors = null;

  try {
    cachedColors = storedAppliedColors ? JSON.parse(storedAppliedColors) : null;
  } catch {
    cachedColors = null;
  }

  if (savedTheme === "custom") {
    const primaryColor = resolvePrimaryColor(
      localStorage.getItem("custom-primary") || defaultPrimary,
    );
    const colorsByMode = storedColorsByMode
      ? {
          light: refreshPrimarySurfaceColors(
            storedColorsByMode.light,
            primaryColor,
            "light",
          ),
          dark: refreshPrimarySurfaceColors(
            storedColorsByMode.dark,
            primaryColor,
            "dark",
          ),
        }
      : buildColorsByMode(primaryColor);
    let colors = colorsByMode[mode] || cachedColors;

    if (!colors || colors.primary === undefined) {
      const storedColors = localStorage.getItem("custom-applied-theme");
      try {
        colors = storedColors ? JSON.parse(storedColors) : null;
      } catch {
        colors = null;
      }
    }

    if (!colors || colors.primary === undefined) {
      colors = calculateTheme(primaryColor, mode);
    } else {
      colors = refreshPrimarySurfaceColors(colors, primaryColor, mode);
    }

    return {
      activeTheme: "custom",
      themeType: ThemeType.CUSTOM,
      mode,
      primaryColor,
      colors,
      colorsByMode,
      source: "localStorage",
    };
  }

  const preset = themePresets[savedTheme] || themePresets.slate;
  const presetKey = themePresets[savedTheme] ? savedTheme : "slate";
  const primaryColor = getPresetPrimaryValue(preset);
  const colorsByMode = storedColorsByMode
    ? {
        light: refreshPrimarySurfaceColors(
          storedColorsByMode.light,
          primaryColor,
          "light",
        ),
        dark: refreshPrimarySurfaceColors(
          storedColorsByMode.dark,
          primaryColor,
          "dark",
        ),
      }
    : buildColorsByMode(primaryColor);
  const colors = refreshPrimarySurfaceColors(
    colorsByMode[mode] ||
      (cachedColors && cachedColors.primary !== undefined
        ? cachedColors
        : calculateTheme(primaryColor, mode)),
    primaryColor,
    mode,
  );

  return {
    activeTheme: presetKey,
    themeType: ThemeType.PRESET,
    mode,
    primaryColor,
    colors,
    colorsByMode,
    source: "localStorage",
  };
};

export const loadDefaultTheme = (mode = "light") => ({
  activeTheme: "slate",
  themeType: ThemeType.PRESET,
  mode,
  primaryColor: themePresets.slate.primary,
  colors: calculateTheme(themePresets.slate.primary, mode),
  source: "default",
});

const canFetchPortalTheme = () => {
  if (typeof window === "undefined") return false;

  const user = getUserData();
  if (user?.id) return true;
  if (localStorage.getItem("accessToken")) return true;
  if (document.cookie.includes("clientToken=")) return true;

  const path = window.location.pathname.replace(/\/+$/, "");
  const isLoginPage = path === "/login" || path.endsWith("/login");
  return !isLoginPage;
};

export const fetchPortalThemeFromApi = async (portalId) => {
  if (!portalId) return null;

  try {
    const response = await fetchWrapper(
      `/api/theme?portalId=${encodeURIComponent(portalId)}`,
      {},
      "fetch-portal-theme",
    );

    if (response.status === 404) return null;
    if (!response.ok) return null;

    const result = await response.json();
    return result?.data ?? null;
  } catch (error) {
    console.error("Failed to fetch portal theme from API:", error);
    return null;
  }
};

export const applyLocalTheme = () => {
  const state = loadThemeFromLocalStorage();
  if (state?.colors) {
    applyTheme(state.colors);
  }
  return state;
};

const applyThemeStateIfAllowed = (state) => {
  if (!state?.colors) return null;
  if (hasUnsavedThemePreview) return state;
  return applyThemeState(state);
};

const loadThemeInternal = async ({ portalId, forcePortalFetch = false } = {}) => {
  const generation = ++loadThemeGeneration;
  const context = getThemeContext(portalId);
  const resolvedPortalId = portalId || context.portalId;

  const applyIfCurrent = (state) => {
    // Ignore stale in-flight loads (e.g. guest load finishing after login).
    if (generation !== loadThemeGeneration) return null;
    const applied = applyThemeStateIfAllowed(state);
    dispatchThemeApplied(applied);
    return applied;
  };

  if (resolvedPortalId && (forcePortalFetch || canFetchPortalTheme())) {
    const dbRecord = await fetchPortalThemeFromApi(resolvedPortalId);
    const dbState = normalizeThemeRecord(dbRecord);
    if (dbState) {
      return applyIfCurrent(dbState);
    }
  }

  const localState = loadThemeFromLocalStorage();
  return applyIfCurrent(localState);
};

export const loadTheme = (options = {}) => {
  if (!loadThemePromise) {
    loadThemePromise = loadThemeInternal(options).finally(() => {
      loadThemePromise = null;
    });
  }
  return loadThemePromise;
};

export const reloadThemeAfterLogin = ({ portalId } = {}) => {
  // Invalidate any in-flight guest/local theme load, then fetch portal theme.
  loadThemePromise = null;
  loadThemeGeneration += 1;
  const context = getThemeContext(portalId);
  const resolvedPortalId = portalId || context.portalId;

  return loadThemeInternal({
    portalId: resolvedPortalId,
    forcePortalFetch: true,
  });
};

export const resetThemeFromDb = async ({ portalId } = {}) => {
  const context = getThemeContext(portalId);
  const resolvedPortalId = portalId || context.portalId;

  if (!resolvedPortalId) {
    throw new Error("Portal not found.");
  }

  const dbRecord = await fetchPortalThemeFromApi(resolvedPortalId);

  if (!dbRecord) {
    throw new Error("No saved portal theme found in database.");
  }

  const dbState = normalizeThemeRecord(dbRecord);
  if (!dbState) {
    throw new Error("Failed to restore saved theme.");
  }

  const applied = applyThemeState(dbState);
  setUnsavedThemePreview(false);
  window.dispatchEvent(
    new CustomEvent("theme-mode-changed", { detail: applied.mode }),
  );
  dispatchThemeApplied(applied);
  return applied;
};

export const previewCustomTheme = (
  primaryColor,
  mode = getStoredMode(),
  { animated = false } = {},
) => {
  const resolvedPrimary = resolvePrimaryColor(primaryColor);
  const colors = calculateTheme(resolvedPrimary, mode);
  applyTheme(colors, { transition: animated });

  const state = {
    activeTheme: "custom",
    themeType: ThemeType.CUSTOM,
    mode,
    primaryColor: resolvedPrimary,
    colors,
  };
  setPreviewState(state);
  return state;
};

export const applyCustomThemeLocal = (
  primaryColor,
  mode = getStoredMode(),
  { animated = false } = {},
) => {
  const resolvedPrimary = resolvePrimaryColor(primaryColor);
  const colorsByMode = buildColorsByMode(resolvedPrimary);
  return applyThemeState(
    {
      activeTheme: "custom",
      themeType: ThemeType.CUSTOM,
      mode,
      primaryColor: resolvedPrimary,
      colors: colorsByMode[mode],
      colorsByMode,
      source: "localStorage",
    },
    { animated },
  );
};

export const previewPresetTheme = (
  presetKey,
  mode = getStoredMode(),
  { animated = false } = {},
) => {
  const preset = themePresets[presetKey];
  if (!preset) return null;

  const primaryColor = getPresetPrimaryValue(preset);
  const colors = calculateTheme(primaryColor, mode);
  applyTheme(colors, { transition: animated });

  const state = {
    activeTheme: presetKey,
    themeType: ThemeType.PRESET,
    mode,
    primaryColor,
    colors,
  };
  setPreviewState(state);
  return state;
};

export const applyPresetThemeLocal = (
  presetKey,
  mode = getStoredMode(),
  { animated = false } = {},
) => {
  const preset = themePresets[presetKey];
  if (!preset) return null;

  const primaryColor = getPresetPrimaryValue(preset);
  const colorsByMode = buildColorsByMode(primaryColor);

  return applyThemeState(
    {
      activeTheme: presetKey,
      themeType: ThemeType.PRESET,
      mode,
      primaryColor,
      colors: colorsByMode[mode],
      colorsByMode,
      source: "localStorage",
    },
    { animated },
  );
};

export const previewThemeMode = (newMode) => {
  if (!previewState) return null;

  let state;
  if (
    previewState.themeType === ThemeType.CUSTOM ||
    previewState.activeTheme === "custom"
  ) {
    state = previewCustomTheme(previewState.primaryColor, newMode, {
      animated: true,
    });
  } else {
    state = previewPresetTheme(previewState.activeTheme, newMode, {
      animated: true,
    });
  }

  window.dispatchEvent(
    new CustomEvent("theme-mode-changed", { detail: newMode }),
  );
  return state;
};

export const toggleGlobalThemeMode = async (newMode) => {
  if (hasUnsavedThemePreview && previewState) {
    localStorage.setItem("mode", newMode);
    return previewThemeMode(newMode);
  }

  localStorage.setItem("mode", newMode);

  const storedColorsByMode = getStoredColorsByMode();
  if (storedColorsByMode?.[newMode]) {
    applyTheme(storedColorsByMode[newMode], { transition: true });
    cacheAppliedColors(storedColorsByMode[newMode]);

    const savedTheme = localStorage.getItem("theme") || "slate";
    if (savedTheme === "custom") {
      localStorage.setItem(
        "custom-applied-theme",
        JSON.stringify(storedColorsByMode[newMode]),
      );
    }

    window.dispatchEvent(
      new CustomEvent("theme-mode-changed", { detail: newMode }),
    );
    return;
  }

  const savedTheme = localStorage.getItem("theme") || "slate";

  if (savedTheme === "custom") {
    const savedPrimary =
      localStorage.getItem("custom-primary") || defaultPrimary;
    applyCustomThemeLocal(savedPrimary, newMode, { animated: true });
  } else if (themePresets[savedTheme]) {
    applyPresetThemeLocal(savedTheme, newMode, { animated: true });
  } else {
    applyPresetThemeLocal("slate", newMode, { animated: true });
  }

  window.dispatchEvent(
    new CustomEvent("theme-mode-changed", { detail: newMode }),
  );
};

export const patchThemeToApi = async ({
  portalId,
  primaryColor,
  presetKey,
  colorsByMode,
  themeType,
}) => {
  const themePayload =
    themeType === ThemeType.PRESET
      ? { presetKey, colorsByMode }
      : { primaryColor, colorsByMode };

  const response = await fetchWrapper(
    "/api/theme",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        portalId,
        theme: themePayload,
        themeType,
      }),
    },
    "patch-theme",
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to update theme.");
  }

  return data.data;
};

export const savePresetThemeToApi = async ({
  portalId,
  presetKey,
}) => {
  const colorsByMode = buildPresetColorsByMode(presetKey);
  if (!colorsByMode) {
    throw new Error("Invalid preset theme.");
  }

  const response = await fetchWrapper(
    "/api/theme",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        portalId,
        theme: {
          presetKey,
          colorsByMode,
        },
        themeType: ThemeType.PRESET,
      }),
    },
    "save-preset-theme",
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to save theme.");
  }

  return data.data;
};

export const saveCustomThemeToApi = async ({
  portalId,
  primaryColor,
}) => {
  const resolvedPrimary = resolvePrimaryColor(primaryColor);
  const colorsByMode = buildColorsByMode(resolvedPrimary);

  const response = await fetchWrapper(
    "/api/theme",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        portalId,
        theme: {
          primaryColor: resolvedPrimary,
          colorsByMode,
        },
        themeType: ThemeType.CUSTOM,
      }),
    },
    "save-custom-theme",
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to save theme.");
  }

  return data.data;
};
