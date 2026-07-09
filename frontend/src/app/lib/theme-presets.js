import {
  buildLinearGradient,
  defaultPrimary,
  isGradientValue,
  isValidHex,
} from "./calculateTheme";

export const themePresets = {
  slate: {
    name: "Slate",
    primary: "#0f172a",
  },
  zinc: {
    name: "Zinc",
    primary: "#7c3bec",
  },
  stone: {
    name: "Stone",
    primary: "#f97415",
  },
  rose: {
    name: "Rose",
    primary: "#e11d48",
  },
  aurora: {
    name: "Aurora",
    type: "gradient",
    primary: buildLinearGradient("#5B21B6", "#F472B6"),
    gradientStart: "#5B21B6",
    gradientEnd: "#F472B6",
  },
  oceanBlue: {
    name: "Ocean Blue",
    type: "gradient",
    primary: buildLinearGradient("#1E3A8A", "#38BDF8"),
    gradientStart: "#1E3A8A",
    gradientEnd: "#38BDF8",
  },
  emerald: {
    name: "Emerald",
    type: "gradient",
    primary: buildLinearGradient("#065F46", "#6EE7B7"),
    gradientStart: "#065F46",
    gradientEnd: "#6EE7B7",
  },
  royalPurple: {
    name: "Royal Purple",
    type: "gradient",
    primary: buildLinearGradient("#3730A3", "#C084FC"),
    gradientStart: "#3730A3",
    gradientEnd: "#C084FC",
  },
  sunsetCoral: {
    name: "Sunset Coral",
    type: "gradient",
    primary: buildLinearGradient("#C2410C", "#FB7185"),
    gradientStart: "#C2410C",
    gradientEnd: "#FB7185",
  },
};

export const getPresetPrimaryValue = (preset) => {
  if (!preset) return defaultPrimary;
  return preset.primary || defaultPrimary;
};

export const buildCustomPrimaryValue = ({
  mode = "single",
  color,
  gradientStart,
  gradientEnd,
  angle,
} = {}) => {
  if (mode === "gradient" && isValidHex(gradientStart) && isValidHex(gradientEnd)) {
    return buildLinearGradient(gradientStart, gradientEnd, angle);
  }

  if (isGradientValue(color)) return color;
  if (isValidHex(color)) return color;
  return defaultPrimary;
};
