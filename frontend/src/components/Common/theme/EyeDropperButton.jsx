"use client";

import { useEffect, useState } from "react";
import { Pipette } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { AppTooltip } from "@/components/ui/tooltip";
import { toast } from "react-toastify";

export const isEyeDropperSupported = () =>
  typeof window !== "undefined" && typeof window.EyeDropper === "function";

export async function pickColorWithEyeDropper() {
  if (!isEyeDropperSupported()) {
    throw new Error("EyeDropper is not supported in this browser.");
  }

  const eyeDropper = new window.EyeDropper();
  const result = await eyeDropper.open();
  return String(result?.sRGBHex || "").toUpperCase();
}

export default function EyeDropperButton({
  onColorPicked,
  onBeforePick,
  disabled = false,
  className,
  compact = false,
  label = "Pick color from screen",
}) {
  const [supported, setSupported] = useState(false);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    setSupported(isEyeDropperSupported());
  }, []);

  if (!supported) return null;

  const handlePick = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled || picking) return;

    try {
      setPicking(true);
      // Close overlays (e.g. color wheel) first, then wait so they unmount
      // before the native eyedropper samples the screen.
      onBeforePick?.();
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setTimeout(resolve, 60));
        });
      });

      const hex = await pickColorWithEyeDropper();
      if (hex) {
        onColorPicked?.(hex);
      }
    } catch (error) {
      // User cancelled with Escape — ignore. Unsupported should not reach here.
      if (error?.name && error.name !== "AbortError") {
        toast.error("Could not pick color from screen.");
      }
    } finally {
      setPicking(false);
    }
  };

  return (
    <AppTooltip label={label}>
      <button
        type="button"
        onClick={handlePick}
        disabled={disabled || picking}
        aria-label={label}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
          compact ? "h-7 w-7" : "h-9 w-9",
          picking && "animate-pulse",
          className,
        )}
      >
        <Pipette className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </button>
    </AppTooltip>
  );
}
