"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { hexToRgb, rgbToHsl } from "@/app/lib/colorUtils";
import {
  Popover,
  PopoverContent,
} from "@/components/ui/popover";
import { CircularColorPicker } from "@/components/Common/theme/CanvaColorPicker";
import EyeDropperButton from "@/components/Common/theme/EyeDropperButton";
import ImageColorPickButton from "@/components/Common/theme/ImageColorPickButton";

const isValidHex = (value) => /^#[0-9A-F]{6}$/i.test(value);

const normalizeHex = (value, fallback) =>
  isValidHex(value) ? value.toUpperCase() : fallback;

/** Relative luminance (0–1). Higher = lighter / closer to white. */
function getRelativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const toLinear = (channel) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * toLinear(rgb.r) +
    0.7152 * toLinear(rgb.g) +
    0.0722 * toLinear(rgb.b)
  );
}

/**
 * True for white or very light tints that wash out UI on gradients.
 * Uses both HSL lightness and relative luminance so pale pastels are caught too.
 */
function isLightTintOrWhite(hex) {
  if (!isValidHex(hex)) return false;
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const { l } = rgbToHsl(rgb);
  const luminance = getRelativeLuminance(hex);
  return l >= 0.78 || luminance >= 0.72;
}

function describeLightStops(startHex, endHex) {
  const startLight = isLightTintOrWhite(startHex);
  const endLight = isLightTintOrWhite(endHex);
  if (startLight && endLight) return "start and end";
  if (startLight) return "start";
  if (endLight) return "end";
  return null;
}

const GRADIENT_WHEEL_SIZE = 250;

const releaseBodyScrollLock = () => {
  if (typeof document === "undefined") return;

  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
  document.body.style.pointerEvents = "";
  document.documentElement.style.overflow = "";
  document.documentElement.style.paddingRight = "";
};

const getWheelSize = () => {
  if (typeof window === "undefined") return GRADIENT_WHEEL_SIZE;
  if (window.innerWidth < 420) return 132;
  if (window.innerWidth < 640) return 140;
  return GRADIENT_WHEEL_SIZE;
};

const getWheelLayout = () => {
  if (typeof window === "undefined") return "row";
  return window.innerWidth < 520 ? "column" : "row";
};

/**
 * Gradient color controls.
 * Custom CircularColorPicker wheel is temporarily replaced by native input type="color".
 * Existing wheel UI is preserved in comments below.
 */
export default function GradientColorPickerSection({
  startColor,
  endColor,
  angle,
  gradientBackground,
  onStartChange,
  onEndChange,
  onAngleChange,
  maxLightness = 0.9,
  className,
}) {
  const [open, setOpen] = useState(false);
  const [wheelSize, setWheelSize] = useState(GRADIENT_WHEEL_SIZE);
  const [wheelLayout, setWheelLayout] = useState("row");
  const anchorRef = useRef(null);

  /** Which gradient stop is active (used when selecting Start/End swatches). */
  const [activeStop, setActiveStop] = useState("start");

  const start = normalizeHex(startColor, "#3B82F6");
  const end = normalizeHex(endColor, "#8B5CF6");

  const handleOpenChange = (nextOpen) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      releaseBodyScrollLock();
    }
  };

  const closePicker = () => {
    setOpen(false);
    releaseBodyScrollLock();
  };

  const openPicker = (element, stop) => {
    if (stop) setActiveStop(stop);
    anchorRef.current = element;
    setOpen(true);
  };

  useEffect(() => () => releaseBodyScrollLock(), []);

  useEffect(() => {
    const updateLayout = () => {
      setWheelSize(getWheelSize());
      setWheelLayout(getWheelLayout());
    };
    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  useEffect(() => {
    if (open) {
      setWheelSize(getWheelSize());
      setWheelLayout(getWheelLayout());
    }
  }, [open]);

  const handleAngleSliderChange = (nextValue) => {
    const nextAngle = Array.isArray(nextValue) ? nextValue[0] : nextValue;
    if (typeof nextAngle === "number") onAngleChange?.(nextAngle);
  };

  const handleImageColorPicked = (hex) => {
    if (activeStop === "end") {
      onEndChange?.(hex);
    } else {
      onStartChange?.(hex);
    }
  };

  const lightStopLabel = useMemo(
    () => describeLightStops(start, end),
    [start, end],
  );

  return (
    <div className={cn("space-y-4", className)}>
      <Label className="block text-sm font-semibold text-foreground">
        Gradient Theme
      </Label>

      {lightStopLabel ? (
        <Alert className="flex flex-col gap-2 border-warning bg-warning text-warning-foreground [&>svg]:text-warning-foreground">
          <div className="flex items-center gap-2 text-warning-foreground">
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle className="text-warning-foreground pt-[1px] font-bold text-base">
              Light tint may hurt gradient contrast
            </AlertTitle>
          </div>
          <AlertDescription className="col-start-2 text-warning-foreground">
            Your gradient {lightStopLabel} color is a very light tint or white.
            Pale shades can wash out buttons, text, and accents, making the UI
            harder to read. Prefer richer mid-tone colors for a clearer, more
            polished look.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        {/* --- Native color inputs + eyedropper (custom wheel commented out) --- */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label
              className="flex cursor-pointer items-center gap-2 rounded-lg p-1 transition-colors hover:bg-accent/50 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary"
              aria-label={`Edit start color ${start}`}
              onClick={() => setActiveStop("start")}
            >
              <input
                type="color"
                value={start}
                onChange={(event) => {
                  setActiveStop("start");
                  onStartChange?.(normalizeHex(event.target.value, start));
                }}
                className="h-10 w-10 cursor-pointer overflow-hidden rounded-lg border border-black/10 bg-transparent p-0 shadow-sm [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:rounded-lg [&::-moz-color-swatch]:border-none"
              />
              <div className="min-w-0 text-left">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Start
                </p>
                <p className="truncate font-mono text-xs font-semibold text-foreground">
                  {start}
                </p>
              </div>
            </label>
            {/* Screen eyedropper trigger — temporarily hidden; feature kept in EyeDropperButton */}
            {/* <EyeDropperButton
              onColorPicked={(hex) => {
                setActiveStop("start");
                onStartChange?.(hex);
              }}
              label="Pick start color from screen"
            /> */}
            <ImageColorPickButton
              onColorPicked={(hex) => {
                setActiveStop("start");
                onStartChange?.(hex);
              }}
              label="Pick from Image"
            />
          </div>

          <span className="text-muted-foreground">→</span>

          <div className="flex items-center gap-1.5">
            <label
              className="flex cursor-pointer items-center gap-2 rounded-lg p-1 transition-colors hover:bg-accent/50 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary"
              aria-label={`Edit end color ${end}`}
              onClick={() => setActiveStop("end")}
            >
              <input
                type="color"
                value={end}
                onChange={(event) => {
                  setActiveStop("end");
                  onEndChange?.(normalizeHex(event.target.value, end));
                }}
                className="h-10 w-10 cursor-pointer overflow-hidden rounded-lg border border-black/10 bg-transparent p-0 shadow-sm [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:rounded-lg [&::-moz-color-swatch]:border-none"
              />
              <div className="min-w-0 text-left">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  End
                </p>
                <p className="truncate font-mono text-xs font-semibold text-foreground">
                  {end}
                </p>
              </div>
            </label>
            {/* Screen eyedropper trigger — temporarily hidden; feature kept in EyeDropperButton */}
            {/* <EyeDropperButton
              onColorPicked={(hex) => {
                setActiveStop("end");
                onEndChange?.(hex);
              }}
              label="Pick end color from screen"
            /> */}
            <ImageColorPickButton
              onColorPicked={(hex) => {
                setActiveStop("end");
                onEndChange?.(hex);
              }}
              label="Pick from Image"
            />
          </div>
        </div>

        {/* --- Previous custom color wheel popover (commented out, do not delete) ---
        <Popover open={open} onOpenChange={handleOpenChange}>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(event) =>
                  openPicker(event.currentTarget, "start")
                }
                className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Edit start color ${start}`}
              >
                <span
                  className="h-10 w-10 shrink-0 rounded-lg border border-black/10 shadow-sm"
                  style={{ backgroundColor: start }}
                />
                <div className="min-w-0 text-left">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Start
                  </p>
                  <p className="truncate font-mono text-xs font-semibold text-foreground">
                    {start}
                  </p>
                </div>
              </button>
              <EyeDropperButton
                onBeforePick={closePicker}
                onColorPicked={(hex) => {
                  setActiveStop("start");
                  onStartChange?.(hex);
                }}
                label="Pick start color from screen"
              />
            </div>

            <span className="text-muted-foreground">→</span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(event) => openPicker(event.currentTarget, "end")}
                className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Edit end color ${end}`}
              >
                <span
                  className="h-10 w-10 shrink-0 rounded-lg border border-black/10 shadow-sm"
                  style={{ backgroundColor: end }}
                />
                <div className="min-w-0 text-left">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    End
                  </p>
                  <p className="truncate font-mono text-xs font-semibold text-foreground">
                    {end}
                  </p>
                </div>
              </button>
              <EyeDropperButton
                onBeforePick={closePicker}
                onColorPicked={(hex) => {
                  setActiveStop("end");
                  onEndChange?.(hex);
                }}
                label="Pick end color from screen"
              />
            </div>

            <ImageColorPickButton
              onBeforePick={closePicker}
              onColorPicked={handleImageColorPicked}
              label={`Upload a photo, then click a pixel to pick the ${activeStop} color`}
              buttonText="Pick from photo"
              hint={`Upload an image, then click a pixel to set the ${activeStop} color. Select Start or End first.`}
            />
          </div>

          <PopoverContent
            anchor={anchorRef}
            initialFocus={false}
            className="z-40 !w-auto !max-w-[calc(100vw-1.5rem)] w-fit overflow-hidden rounded-xl border-border bg-popover !p-3 shadow-lg"
            style={{ width: "fit-content", maxWidth: "none" }}
          >
            <div
              className={cn(
                "custom-scrollbar flex w-fit max-h-[min(70vh,calc(100vh-8rem))] items-start justify-center gap-3 overflow-y-auto overflow-x-hidden px-0.5",
                wheelLayout === "column" ? "flex-col" : "flex-row",
              )}
            >
              <div className="ccp-picker-cell flex w-fit shrink-0 flex-col items-center">
                <p className="mb-1 w-full text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Start
                </p>
                <CircularColorPicker
                  value={start}
                  fallback="#3B82F6"
                  onChange={onStartChange}
                  onEyeDropperOpen={closePicker}
                  size={wheelSize}
                  showHexRow
                  compact
                  maxLightness={maxLightness}
                />
              </div>

              {wheelLayout === "row" ? (
                <div className="w-px shrink-0 self-stretch bg-border" />
              ) : null}

              <div className="ccp-picker-cell flex w-fit shrink-0 flex-col items-center">
                <p className="mb-1 w-full text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  End
                </p>
                <CircularColorPicker
                  value={end}
                  fallback="#8B5CF6"
                  onChange={onEndChange}
                  onEyeDropperOpen={closePicker}
                  size={wheelSize}
                  showHexRow
                  compact
                  maxLightness={maxLightness}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
        --- end previous custom wheel --- */}

        <div className="border-t border-border pt-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Gradient direction</p>
              <p className="text-xs text-muted-foreground">
                Rotate the gradient to any angle.
              </p>
            </div>
            <div className="rounded-full border border-border bg-background px-3 py-1 text-sm font-semibold text-foreground">
              {angle}&deg;
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-border shadow-sm"
              style={{ background: gradientBackground }}
            >
              <div
                className="h-7 w-1 rounded-full bg-white shadow-sm transition-transform duration-200"
                style={{ transform: `rotate(${angle}deg)` }}
              />
            </div>

            <div className="flex-1">
              <Slider
                min={0}
                max={360}
                step={1}
                value={[angle]}
                onValueChange={handleAngleSliderChange}
                trackClassName="h-2 bg-muted-foreground/30"
                rangeClassName="bg-[var(--primary-solid)]"
                thumbClassName="size-4 border-2 border-background bg-foreground shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
