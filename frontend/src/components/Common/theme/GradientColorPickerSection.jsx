"use client";

import { useEffect, useRef, useState } from "react";
import { Palette } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
} from "@/components/ui/popover";
import { CircularColorPicker } from "@/components/Common/theme/CanvaColorPicker";
import EyeDropperButton from "@/components/Common/theme/EyeDropperButton";

const isValidHex = (value) => /^#[0-9A-F]{6}$/i.test(value);

const normalizeHex = (value, fallback) =>
  isValidHex(value) ? value.toUpperCase() : fallback;

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
  const editButtonRef = useRef(null);

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

  const openPicker = (element) => {
    anchorRef.current = element ?? editButtonRef.current;
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

  return (
    <div className={cn("space-y-4", className)}>
      <Label className="block text-sm font-semibold text-foreground">
        Gradient Theme
      </Label>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <Popover open={open} onOpenChange={handleOpenChange}>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(event) => openPicker(event.currentTarget)}
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
                onColorPicked={(hex) => onStartChange?.(hex)}
                label="Pick start color from screen"
              />
            </div>

            <span className="text-muted-foreground">→</span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(event) => openPicker(event.currentTarget)}
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
                onColorPicked={(hex) => onEndChange?.(hex)}
                label="Pick end color from screen"
              />
            </div>

            <button
              ref={editButtonRef}
              type="button"
              onClick={(event) => openPicker(event.currentTarget)}
              className="group ml-auto inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-primary hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Palette className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
              Edit colors
            </button>
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
