"use client";

import { useState } from "react";
import { Pipette } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { AppTooltip } from "@/components/ui/tooltip";
import { toast } from "react-toastify";
import {
  startEyedropper,
  isEyedropperActive,
} from "@/app/lib/eyedropper";

/** Always available — custom capture magnifier, not the native EyeDropper API. */
export const isEyeDropperSupported = () =>
  typeof window !== "undefined" && typeof document !== "undefined";

/**
 * Pick a color from the current screen via the high-performance magnifier.
 * @param {import('@/app/lib/eyedropper/EyedropperController').EyedropperOptions} [options]
 * @returns {Promise<string|null>}
 */
export async function pickColorWithEyeDropper(options = {}) {
  if (!isEyeDropperSupported()) {
    throw new Error("Eyedropper is not available in this environment.");
  }

  const hex = await startEyedropper({
    zoom: 10,
    magnifierSize: 130,
    sampleSize: 13,
    ...options,
  });

  return hex ? String(hex).toUpperCase() : null;
}

export default function EyeDropperButton({
  onColorPicked,
  onBeforePick,
  disabled = false,
  className,
  compact = false,
  label = "Pick color from screen",
}) {
  const [picking, setPicking] = useState(false);

  const handlePick = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    // One session at a time; each click starts a new session with a fresh snapshot.
    if (disabled || picking || isEyedropperActive()) return;

    try {
      setPicking(true);
      // Close overlays first, then wait so they unmount before this session's capture.
      onBeforePick?.();
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setTimeout(resolve, 80));
        });
      });

      // startEyedropper always captures a new screen snapshot for this session.
      const hex = await pickColorWithEyeDropper();
      if (hex) {
        onColorPicked?.(hex);
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
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
