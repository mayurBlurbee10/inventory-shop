"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { TriangleAlert, Palette, Layers, Check } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { toast } from "react-toastify";
import { ThemeType, UserRole } from "@/config/constants";
import { getUserData } from "@/lib/auth";
import {
  getPreviewState,
  getUnsavedThemePreview,
  loadThemeFromLocalStorage,
  previewCustomTheme,
  previewPresetTheme,
  resetThemeFromDb,
  saveCustomThemeToApi,
  savePresetThemeToApi,
  setUnsavedThemePreview,
} from "@/lib/theme-manager";
import { buildCustomPrimaryValue, themePresets } from "@/lib/theme-presets";
import {
  buildProcessedGradient,
  calculateTheme,
  defaultPrimary,
  GRADIENT_DEFAULT_ANGLE,
  parsePrimaryColor,
} from "@/lib/calculateTheme";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ColorPickerPopover from "@/components/Common/theme/CanvaColorPicker";
import GradientColorPickerSection from "@/components/Common/theme/GradientColorPickerSection";

export { toggleGlobalThemeMode } from "@/lib/theme-manager";

export default function ThemeContent() {
  const params = useParams();
  const user = getUserData();
  const canEditPortalTheme =
    user?.role !== UserRole.USER && user?.role !== UserRole.MODERATOR;
  const [activeTheme, setActiveTheme] = useState("slate");
  const [mode, setMode] = useState("light");
  const [primaryColor, setPrimaryColor] = useState(defaultPrimary);
  const [customColorMode, setCustomColorMode] = useState("single");
  const [gradientStartColor, setGradientStartColor] = useState("#3B82F6");
  const [gradientEndColor, setGradientEndColor] = useState("#8B5CF6");
  const [gradientAngle, setGradientAngle] = useState(GRADIENT_DEFAULT_ANGLE);
  const [themeType, setThemeType] = useState("preset");
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const hasUnsavedChanges = useRef(false);

  const markPreview = () => {
    hasUnsavedChanges.current = true;
    setShowUnsavedWarning(true);
    setUnsavedThemePreview(true);
  };

  const markSaved = () => {
    hasUnsavedChanges.current = false;
    setShowUnsavedWarning(false);
    setUnsavedThemePreview(false);
  };

  const UnsavedThemeWarning = () => (
    <Alert className="mb-4 border-warning/40 bg-warning/10 text-foreground [&>svg]:text-warning">
      <TriangleAlert className="h-4 w-4" />
      <AlertTitle className="text-foreground">Unsaved theme changes</AlertTitle>
      <AlertDescription className="col-start-2 text-muted-foreground">
        You are previewing a theme that has not been applied yet. Click Apply to
        save your Preference, or Reset to discard changes. Refreshing the page will
        restore your last saved theme.
      </AlertDescription>
    </Alert>
  );

  const isValidHex = (value) => /^#[0-9A-F]{6}$/i.test(value);

  const appliedTheme = useMemo(() => {
    return calculateTheme(primaryColor, mode);
  }, [primaryColor, mode]);

  const resolveNormalizedGradient = (
    startColor,
    endColor,
    angle = gradientAngle,
  ) => {
    const processed = buildProcessedGradient(startColor, endColor, mode, angle);

    return {
      primary: processed.raw,
      start: processed.start,
      end: processed.end,
      angle: processed.angle,
    };
  };

  const previewGradientTheme = (
    startColor,
    endColor,
    angle = gradientAngle,
  ) => {
    if (!isValidHex(startColor) || !isValidHex(endColor)) return null;

    const normalized = resolveNormalizedGradient(startColor, endColor, angle);
    setGradientStartColor(startColor);
    setGradientEndColor(endColor);
    setGradientAngle(normalized.angle);

    const state = previewCustomTheme(normalized.primary, mode);
    markPreview();
    setPrimaryColor(normalized.primary);
    setActiveTheme("custom");
    setThemeType("custom");
    if (state) syncUiFromThemeState(state);
    return normalized;
  };

  const gradientBackground = useMemo(
    () =>
      appliedTheme["primary-bg"] ||
      `linear-gradient(${gradientAngle}deg, ${gradientStartColor} 0%, ${gradientEndColor} 100%)`,
    [appliedTheme, gradientAngle, gradientEndColor, gradientStartColor],
  );

  const syncUiFromThemeState = (state) => {
    if (!state) return;

    const parsedPrimary = parsePrimaryColor(state.primaryColor);

    setMode(state.mode);
    setPrimaryColor(state.primaryColor);
    setCustomColorMode(parsedPrimary.isGradient ? "gradient" : "single");
    setGradientStartColor(parsedPrimary.start || defaultPrimary);
    setGradientEndColor(parsedPrimary.end || "#8B5CF6");
    setGradientAngle(parsedPrimary.angle ?? GRADIENT_DEFAULT_ANGLE);
    setThemeType(state.themeType === ThemeType.CUSTOM ? "custom" : "preset");
    setActiveTheme(state.activeTheme);
  };

  useEffect(() => {
    const syncFromState = (state) => {
      if (!state) return;
      syncUiFromThemeState(state);
    };

    if (getUnsavedThemePreview()) {
      const preview = getPreviewState();
      if (preview) {
        syncFromState(preview);
        hasUnsavedChanges.current = true;
        setShowUnsavedWarning(true);
      } else {
        syncFromState(loadThemeFromLocalStorage());
      }
    } else {
      syncFromState(loadThemeFromLocalStorage());
    }

    setIsLoading(false);

    const handleThemeApplied = (event) => {
      if (!hasUnsavedChanges.current) {
        syncFromState(event.detail);
      }
    };

    window.addEventListener("theme-applied", handleThemeApplied);
    return () => window.removeEventListener("theme-applied", handleThemeApplied);
  }, []);

  useEffect(() => {
    const handleGlobalModeChange = (e) => {
      setMode(e.detail);
    };
    window.addEventListener("theme-mode-changed", handleGlobalModeChange);
    return () => window.removeEventListener("theme-mode-changed", handleGlobalModeChange);
  }, []);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      document.body.style.pointerEvents = "";
      document.documentElement.style.overflow = "";
      document.documentElement.style.paddingRight = "";
    };
  }, []);

  // const handleModeChange = (newMode) => {
  //   if (newMode === mode) return;

  //   if (hasUnsavedChanges.current) {
  //     const state = previewThemeMode(newMode);
  //     if (state) syncUiFromThemeState(state);
  //   } else {
  //     toggleGlobalThemeMode(newMode);
  //   }
  // };

  const handleThemeChange = (themeKey) => {
    const state = previewPresetTheme(themeKey, mode);
    if (!state) return;
    markPreview();
    syncUiFromThemeState(state);
  };

  const handleResetTheme = async () => {
    if (!canEditPortalTheme) {
      toast.error("Only portal admins can change the theme.");
      return;
    }

    const portalId = params?.portalid || user?.portalId || "root";

    try {
      setIsResetting(true);
      const state = await resetThemeFromDb({ portalId });
      syncUiFromThemeState(state);
      markSaved();
      toast.success("Theme reset to saved version.");
    } catch (error) {
      console.error("Error resetting theme:", error);
      toast.error(error.message || "Failed to reset theme.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleApplyPresetTheme = async () => {
    if (!canEditPortalTheme) {
      toast.error("Only portal admins can change the theme.");
      return;
    }

    const preset = themePresets[activeTheme];
    if (!preset) {
      toast.error("Please select a preset theme.");
      return;
    }

    const portalId = params?.portalid || user?.portalId || "root";

    try {
      setIsSaving(true);
      await savePresetThemeToApi({
        portalId,
        presetKey: activeTheme,
      });
      const state = await resetThemeFromDb({ portalId });
      syncUiFromThemeState(state);
      markSaved();
      toast.success("Portal theme saved for all users.");
    } catch (error) {
      console.error("Error saving preset theme:", error);
      toast.error(error.message || "Failed to save preset theme.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrimaryChange = (value) => {
    setPrimaryColor(value);
    if (!isValidHex(value)) return;
    const state = previewCustomTheme(value, mode);
    markPreview();
    setActiveTheme("custom");
    setThemeType("custom");
    if (state) syncUiFromThemeState(state);
  };

  const handleGradientColorChange = (position, value) => {
    const nextStart = position === "start" ? value : gradientStartColor;
    const nextEnd = position === "end" ? value : gradientEndColor;
    previewGradientTheme(nextStart, nextEnd, gradientAngle);
  };

  const handleGradientDirectionChange = (angle) => {
    previewGradientTheme(gradientStartColor, gradientEndColor, angle);
  };

  const handleCustomColorModeChange = (nextMode) => {
    setCustomColorMode(nextMode);
    if (nextMode === "single") {
      const nextPrimary = isValidHex(primaryColor)
        ? primaryColor
        : gradientStartColor || defaultPrimary;
      const state = previewCustomTheme(nextPrimary, mode);
      markPreview();
      setPrimaryColor(nextPrimary);
      setActiveTheme("custom");
      setThemeType("custom");
      if (state) syncUiFromThemeState(state);
    }

    if (nextMode === "gradient") {
      previewGradientTheme(gradientStartColor, gradientEndColor, gradientAngle);
    }
  };

  const renderColorPicker = ({
    label,
    value,
    fallback,
    onChange,
    pickerLabel,
    maxLightness = 1,
  }) => (
    <ColorPickerPopover
      label={label}
      pickerLabel={pickerLabel || label}
      value={isValidHex(value) ? value : fallback}
      fallback={fallback}
      onChange={onChange}
      maxLightness={maxLightness}
    />
  );

  const handleApplyCustomTheme = async () => {
    if (!canEditPortalTheme) {
      toast.error("Only portal admins can change the theme.");
      return;
    }

    const nextPrimary =
      customColorMode === "gradient"
        ? resolveNormalizedGradient(
            gradientStartColor,
            gradientEndColor,
            gradientAngle,
          ).primary
        : buildCustomPrimaryValue({
            mode: customColorMode,
            color: primaryColor,
            gradientStart: gradientStartColor,
            gradientEnd: gradientEndColor,
            angle: gradientAngle,
          });
    const portalId = params?.portalid || user?.portalId || "root";

    try {
      setIsSaving(true);
      await saveCustomThemeToApi({
        portalId,
        primaryColor: nextPrimary,
      });
      const state = await resetThemeFromDb({ portalId });
      syncUiFromThemeState(state);
      markSaved();
      toast.success(
        customColorMode === "gradient"
          ? "Portal gradient theme saved for all users."
          : "Portal theme saved for all users.",
      );
    } catch (error) {
      console.error("Error saving custom theme:", error);
      toast.error(error.message || "Failed to save custom theme.");
    } finally {
      setIsSaving(false);
    }
  };

  const customStyleOptions = [
    {
      key: "single",
      label: "Single Color",
      description: "One primary color for buttons, links, and accents.",
      icon: Palette,
    },
    {
      key: "gradient",
      label: "Gradient",
      description: "Blend two colors with a custom direction.",
      icon: Layers,
    },
  ];

  const singlePreviewColor = isValidHex(primaryColor) ? primaryColor : defaultPrimary;

  const renderCustomThemeActions = () => (
    <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
      <Button
        type="button"
        onClick={handleResetTheme}
        disabled={isResetting || isSaving || !canEditPortalTheme}
        variant="outline"
        className="h-11 border-border bg-background text-foreground hover:bg-accent"
      >
        {isResetting ? "Resetting..." : "Reset"}
      </Button>
      <Button
        type="button"
        onClick={handleApplyCustomTheme}
        disabled={isSaving || isResetting || !canEditPortalTheme}
        className="h-11 bg-primary text-primary-foreground hover:opacity-90"
      >
        {isSaving ? "Saving..." : "Apply"}
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <main className="bg-background p-4 text-foreground md:p-8">
        <div className="mx-auto max-w-5xl text-sm text-muted-foreground">
          Loading theme settings...
        </div>
      </main>
    );
  }

  return (
    <main className="bg-background text-foreground transition-colors duration-300 md:p-8">
      <div className="mx-auto max-w-5xl">
        <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="mb-2 w-fit text-sm font-semibold uppercase tracking-wide bg-primary text-primary-foreground p-2 rounded-full">
                  Theme Settings
                </p>

                <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
                  Theme Changer
                </CardTitle>

                <CardDescription className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Choose a preset theme or create your own Material-style theme using
                  a single color or gradient. When an admin applies a theme, it is
                  shared by everyone who uses this portal.
                </CardDescription>
              </div>

            </div>
          </CardHeader>

          <CardContent className="space-y-8 p-6 md:p-8">
            {!canEditPortalTheme && (
              <Alert className="border-border bg-muted/50 text-foreground">
                <TriangleAlert className="h-4 w-4 text-muted-foreground" />
                <AlertTitle className="text-foreground">View only</AlertTitle>
                <AlertDescription className="text-muted-foreground">
                  Only portal admins can change the theme. You are viewing the
                  theme shared by everyone on this portal.
                </AlertDescription>
              </Alert>
            )}

            {/* Theme Type Toggle */}
            <section>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">Theme Type</h3>
                <p className="text-sm text-muted-foreground">
                  Choose between preset themes or a custom color.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {["preset", "custom"].map((type) => (
                  <Button
                    key={type}
                    type={themeType !== type ? "Primary" : "Secondary"}
                    onClick={() => {
                      setThemeType(type)
                    }}
                    variant={themeType === type ? "default" : "secondary"}
                    className={`h-12 rounded-xl capitalize`}
                  >
                    {type} Color
                  </Button>
                ))}
              </div>
            </section>

            {/* Preset Themes */}
            {showUnsavedWarning && <UnsavedThemeWarning />}
            {themeType === "preset" && (
              <section>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Preset Themes</h3>
                  <p className="text-sm text-muted-foreground">
                    Select a ready-made color theme, then click Apply to save.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {Object.entries(themePresets).map(([key, theme]) => {
                    const presetApplied = calculateTheme(theme.primary, mode);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleThemeChange(key)}
                        className={`rounded-2xl border p-4 text-left transition-all duration-200 ${activeTheme === key
                          ? "border-primary bg-primary text-primary-foreground shadow-md"
                          : "border-border bg-background text-foreground hover:border-primary hover:shadow-sm"
                          }`}
                      >
                        <div className="mb-4 flex gap-2">
                          {["primary", "surface", "accent", "background"].map(
                            (colorKey) => (
                              <span
                                key={colorKey}
                                className="h-7 w-7 rounded-full border border-border"
                                style={{
                                  ...(colorKey === "primary"
                                    ? {
                                        background:
                                          presetApplied["primary-bg"] ||
                                          (presetApplied.primary
                                            ? `hsl(${presetApplied.primary})`
                                            : "transparent"),
                                      }
                                    : {
                                        backgroundColor: presetApplied[colorKey]
                                          ? `hsl(${presetApplied[colorKey]})`
                                          : "transparent",
                                      }),
                                }}
                              />
                            )
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{theme.name}</p>
                          {theme.type === "gradient" && (
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                activeTheme === key
                                  ? "text-white"
                                  : "text-white shadow-sm"
                              }`}
                              style={{
                                background:
                                  presetApplied["primary-bg"] ||
                                  theme.primary,
                              }}
                            >
                              Gradient
                            </span>
                          )}
                        </div>
                        <p
                          className={`mt-1 text-xs ${activeTheme === key ? "text-primary-foreground/80" : "text-muted-foreground"
                            }`}
                        >
                          Preset theme
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    type="button"
                    onClick={handleResetTheme}
                    disabled={isResetting || isSaving || !canEditPortalTheme}
                    variant="outline"
                    className="h-11 border-border bg-background text-foreground hover:bg-accent"
                  >
                    {isResetting ? "Resetting..." : "Reset"}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleApplyPresetTheme}
                    disabled={isSaving || isResetting || !canEditPortalTheme}
                    className="h-11 bg-primary text-primary-foreground hover:opacity-90"
                  >
                    {isSaving ? "Saving..." : "Apply"}
                  </Button>
                </div>
              </section>
            )}

            {/* Custom Theme */}
            {themeType === "custom" && (
              <section className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Custom Material Theme
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose a single color or gradient, preview it live, then apply across
                    the portal.
                  </p>
                </div>

                {/* Style option cards */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {customStyleOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = customColorMode === option.key;

                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => handleCustomColorModeChange(option.key)}
                        className={cn(
                          "group relative rounded-2xl border p-5 text-left transition-all duration-200",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                            : "border-border bg-card hover:border-primary/40 hover:shadow-sm",
                        )}
                      >
                        {isSelected ? (
                          <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        ) : null}

                        <div className="flex items-start gap-3">
                          <span
                            className={cn(
                              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
                              isSelected
                                ? "border-primary/30 bg-primary/10 text-secondary-foreground"
                                : "border-border bg-muted text-muted-foreground group-hover:text-foreground",
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </span>

                          <div className="min-w-0 pr-8">
                            <p className="font-semibold text-foreground">{option.label}</p>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              {option.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Live preview */}

                  {customColorMode === "single" ? (
                    renderColorPicker({
                      label: "Primary Color",
                      pickerLabel: "Pick a color",
                      value: primaryColor,
                      fallback: defaultPrimary,
                      onChange: handlePrimaryChange,
                      maxLightness: 1,
                    })
                  ) : (
                    <GradientColorPickerSection
                      startColor={gradientStartColor}
                      endColor={gradientEndColor}
                      angle={gradientAngle}
                      gradientBackground={gradientBackground}
                      onStartChange={(value) => handleGradientColorChange("start", value)}
                      onEndChange={(value) => handleGradientColorChange("end", value)}
                      onAngleChange={handleGradientDirectionChange}
                      maxLightness={0.7}
                    />
                  )}
                    
                {renderCustomThemeActions()}
              </section>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
