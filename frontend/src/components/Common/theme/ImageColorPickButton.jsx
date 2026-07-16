"use client";

import { useRef, useState } from "react";
import { ImagePlus, Pipette } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { AppTooltip } from "@/components/ui/tooltip";
import { toast } from "react-toastify";
import {
  startImageEyedropper,
  isImageEyedropperActive,
} from "@/app/lib/eyedropper/ImageEyedropper";
import { isEyedropperActive } from "@/app/lib/eyedropper";

const ACCEPTED = "image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp";

/**
 * Upload a photo, then pick a color from it with the magnifier eyedropper.
 * Compact icon mode matches EyeDropperButton sizing for theme controls.
 */
export default function ImageColorPickButton({
  onColorPicked,
  onBeforePick,
  disabled = false,
  className,
  compact = false,
  label = "Pick from Image",
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const openFilePicker = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled || busy || isEyedropperActive() || isImageEyedropperActive()) {
      return;
    }
    inputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    // Allow selecting the same file again later.
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }

    try {
      setBusy(true);
      onBeforePick?.();

      const hex = await startImageEyedropper(file, {
        zoom: 10,
        magnifierSize: 130,
        sampleSize: 13,
      });

      if (hex) {
        onColorPicked?.(String(hex).toUpperCase());
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not pick color from image.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleFileChange}
      />
      <AppTooltip label={label}>
        <button
          type="button"
          onClick={openFilePicker}
          disabled={disabled || busy}
          aria-label={label}
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
            compact ? "h-7 w-7" : "h-9 w-9",
            busy && "animate-pulse",
            className,
          )}
        >
          <span className="relative inline-flex">
            <ImagePlus
              className={compact ? "h-3.5 w-3.5" : "h-4 w-4"}
            />
            <Pipette
              className={cn(
                "absolute -bottom-0.5 -right-0.5",
                compact ? "h-2 w-2" : "h-2.5 w-2.5",
              )}
            />
          </span>
        </button>
      </AppTooltip>
    </>
  );
}
