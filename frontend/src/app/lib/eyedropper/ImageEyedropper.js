/**
 * Eyedropper that samples an uploaded image (not the live DOM / screen).
 *
 * Flow: load image → show contained preview stage → rAF magnifier from ImageBitmap.
 */

import { clamp } from "./utilities";
import { getMagnifierPosition } from "./CoordinateMapper";
import { createColorSampler } from "./ColorSampler";
import { createMagnifierRenderer } from "./MagnifierRenderer";
import { createOverlay } from "./OverlayManager";
import { createAnimationLoop } from "./AnimationLoop";
import { isEyedropperActive } from "./EyedropperController";

/** @type {boolean} */
let imageActive = false;

/**
 * @param {File|Blob|string} source
 * @returns {Promise<{ bitmap: ImageBitmap|HTMLImageElement, width: number, height: number, revoke: () => void }>}
 */
async function loadImageSource(source) {
  let objectUrl = null;
  let revoke = () => {};

  if (typeof source === "string") {
    objectUrl = source;
  } else if (typeof Blob !== "undefined" && source instanceof Blob) {
    objectUrl = URL.createObjectURL(source);
    revoke = () => {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        // ignore
      }
    };
  } else {
    throw new Error("Unsupported image source.");
  }

  const loadViaImageElement = () =>
    new Promise((resolve, reject) => {
      const el = new Image();
      el.decoding = "async";
      el.onload = () => {
        resolve({
          bitmap: el,
          width: el.naturalWidth || el.width,
          height: el.naturalHeight || el.height,
          revoke,
        });
      };
      el.onerror = () => {
        revoke();
        reject(new Error("Could not load image."));
      };
      el.src = objectUrl;
    });

  try {
    // Prefer ImageBitmap when available; fall back to <img> if it fails.
    if (typeof createImageBitmap === "function" && source instanceof Blob) {
      try {
        const bitmap = await createImageBitmap(source);
        revoke();
        return {
          bitmap,
          width: bitmap.width,
          height: bitmap.height,
          revoke: () => {
            if (typeof bitmap.close === "function") bitmap.close();
          },
        };
      } catch {
        // Fall through to HTMLImageElement path.
      }
    }

    return await loadViaImageElement();
  } catch (error) {
    revoke();
    throw error;
  }
}

const PREVIEW_MAX_WIDTH = 920;
const PREVIEW_PADDING_X = 48;
const PREVIEW_PADDING_Y = 96;
const MIN_PREVIEW_LONG_SIDE = 480;
const MIN_PREVIEW_SHORT_SIDE = 320;

function getPreviewMaxBox() {
  const maxWidth = Math.max(
    160,
    Math.min(PREVIEW_MAX_WIDTH, window.innerWidth - PREVIEW_PADDING_X),
  );
  const maxHeight = Math.max(
    160,
    Math.min(window.innerHeight * 0.72, window.innerHeight - PREVIEW_PADDING_Y),
  );
  return { maxWidth, maxHeight };
}

/**
 * Scale the preview so small images are large enough to sample, while large
 * images still fit in the viewport. Aspect ratio is preserved.
 */
export function computeImagePreviewSize(
  naturalWidth,
  naturalHeight,
  maxWidth,
  maxHeight,
) {
  const nw = Math.max(1, naturalWidth);
  const nh = Math.max(1, naturalHeight);
  const maxW = Math.max(1, maxWidth);
  const maxH = Math.max(1, maxHeight);

  const fitScale = Math.min(maxW / nw, maxH / nh);
  const longSide = Math.max(nw, nh);
  const shortSide = Math.min(nw, nh);
  const minScale = Math.max(
    MIN_PREVIEW_LONG_SIDE / longSide,
    MIN_PREVIEW_SHORT_SIDE / shortSide,
  );

  const scale =
    fitScale < 1
      ? fitScale
      : Math.min(Math.max(1, minScale), fitScale);

  return {
    width: Math.max(1, Math.round(nw * scale)),
    height: Math.max(1, Math.round(nh * scale)),
    scale,
    upscaled: scale > 1.01,
  };
}

function applyPreviewSize(display, frame, naturalWidth, naturalHeight) {
  const { maxWidth, maxHeight } = getPreviewMaxBox();
  const preview = computeImagePreviewSize(
    naturalWidth,
    naturalHeight,
    maxWidth,
    maxHeight,
  );

  Object.assign(display.style, {
    width: `${preview.width}px`,
    height: `${preview.height}px`,
    imageRendering: preview.upscaled ? "pixelated" : "auto",
  });

  Object.assign(frame.style, {
    width: `${preview.width}px`,
    height: `${preview.height}px`,
    maxWidth: `${maxWidth}px`,
    maxHeight: `${maxHeight}px`,
  });

  return preview;
}

/**
 * Create a full-viewport stage that displays the image (object-fit: contain).
 * Small images are scaled up so the eyedropper has a usable target.
 * @param {ImageBitmap|HTMLImageElement} bitmap
 * @param {number} width
 * @param {number} height
 */
function createImageStage(bitmap, width, height) {
  const root = document.createElement("div");
  root.setAttribute("data-eyedropper-image-stage", "true");
  Object.assign(root.style, {
    position: "fixed",
    inset: "0",
    zIndex: "2147483646",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "24px",
    boxSizing: "border-box",
    background: "rgba(10, 10, 12, 0.82)",
    backdropFilter: "blur(2px)",
    userSelect: "none",
  });

  const hint = document.createElement("p");
  hint.textContent = "Click the image to pick a color · Esc to cancel";
  Object.assign(hint.style, {
    margin: "0",
    color: "rgba(255,255,255,0.85)",
    fontSize: "13px",
    fontFamily:
      'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    letterSpacing: "0.01em",
    textAlign: "center",
  });

  const frame = document.createElement("div");
  Object.assign(frame.style, {
    position: "relative",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 20px 50px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08)",
    background: "#111",
    cursor: "none",
  });

  // Draw bitmap into a canvas so we have stable getBoundingClientRect mapping
  // even when source is ImageBitmap (which can't be an <img> src).
  const display = document.createElement("canvas");
  display.width = width;
  display.height = height;
  Object.assign(display.style, {
    display: "block",
    verticalAlign: "middle",
  });

  const dctx = display.getContext("2d", { alpha: true });
  if (!dctx) throw new Error("Could not create image display context.");
  dctx.imageSmoothingEnabled = false;
  dctx.drawImage(bitmap, 0, 0);
  applyPreviewSize(display, frame, width, height);

  frame.appendChild(display);
  root.appendChild(hint);
  root.appendChild(frame);
  document.body.appendChild(root);

  return {
    root,
    frame,
    display,
    resize(nextWidth, nextHeight) {
      applyPreviewSize(display, frame, nextWidth, nextHeight);
    },
    dispose() {
      if (root.parentNode) root.parentNode.removeChild(root);
    },
  };
}

/**
 * Map client coords to natural image bitmap pixels using the displayed element box.
 *
 * @param {number} clientX
 * @param {number} clientY
 * @param {DOMRect} rect
 * @param {number} bitmapWidth
 * @param {number} bitmapHeight
 * @returns {{ x: number, y: number, inside: boolean }}
 */
export function clientToImageBitmap(
  clientX,
  clientY,
  rect,
  bitmapWidth,
  bitmapHeight,
) {
  if (rect.width <= 0 || rect.height <= 0) {
    return { x: 0, y: 0, inside: false };
  }

  const inside =
    clientX >= rect.left &&
    clientX < rect.right &&
    clientY >= rect.top &&
    clientY < rect.bottom;

  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  const scaleX = bitmapWidth / rect.width;
  const scaleY = bitmapHeight / rect.height;

  const x = clamp(Math.floor(localX * scaleX), 0, Math.max(0, bitmapWidth - 1));
  const y = clamp(Math.floor(localY * scaleY), 0, Math.max(0, bitmapHeight - 1));

  return { x, y, inside };
}

/**
 * Start eyedropper mode over an uploaded image.
 *
 * @param {File|Blob|string} source
 * @param {import('./EyedropperController').EyedropperOptions} [options]
 * @returns {Promise<string|null>}
 */
export function startImageEyedropper(source, options = {}) {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Image eyedropper requires a browser environment."),
    );
  }

  if (imageActive || isEyedropperActive()) {
    return Promise.reject(new Error("Eyedropper is already active."));
  }

  const {
    zoom = 10,
    magnifierSize = 130,
    sampleSize = 13,
    onMove,
    onPick,
    onCancel,
  } = options;

  imageActive = true;

  return new Promise(async (resolve, reject) => {
    let loaded = null;
    let stage = null;
    let overlay = null;
    let renderer = null;
    let sampler = null;
    let loop = null;
    let loupeSize = magnifierSize;
    let settled = false;
    let overImage = false;

    const mouse = {
      clientX: window.innerWidth / 2,
      clientY: window.innerHeight / 2,
    };
    const lastColor = { hex: "#000000", r: 0, g: 0, b: 0 };
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    const cleanup = () => {
      if (settled) return;
      settled = true;
      imageActive = false;

      document.documentElement.style.overflow = previousOverflow;

      window.removeEventListener("pointermove", onPointerMove, true);
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("contextmenu", onContextMenu, true);
      window.removeEventListener("wheel", onWheel, true);
      window.removeEventListener("resize", onResize, true);

      loop?.stop();
      renderer?.dispose();
      sampler?.dispose();
      overlay?.dispose();
      stage?.dispose();
      loaded?.revoke?.();

      loop = null;
      renderer = null;
      sampler = null;
      overlay = null;
      stage = null;
      loaded = null;
    };

    const finishPick = () => {
      if (!overImage) return;
      const hex = lastColor.hex;
      cleanup();
      onPick?.(hex);
      resolve(hex);
    };

    const finishCancel = () => {
      cleanup();
      onCancel?.();
      resolve(null);
    };

    const onPointerMove = (event) => {
      mouse.clientX = event.clientX;
      mouse.clientY = event.clientY;
      loop?.requestFrame();
    };

    const onPointerDown = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.button === 2) {
        finishCancel();
        return;
      }
      if (event.button === 0) {
        if (overImage) finishPick();
        else finishCancel();
      }
    };

    const onClick = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finishCancel();
      }
    };

    const onContextMenu = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const onWheel = (event) => {
      event.preventDefault();
    };

    const onResize = () => {
      if (stage && loaded) {
        stage.resize(loaded.width, loaded.height);
      }
      loop?.requestFrame();
    };

    const renderFrame = () => {
      if (!loaded || !renderer || !sampler || !overlay || !stage) return;

      const rect = stage.display.getBoundingClientRect();
      const mapped = clientToImageBitmap(
        mouse.clientX,
        mouse.clientY,
        rect,
        loaded.width,
        loaded.height,
      );

      overImage = mapped.inside;

      if (mapped.inside) {
        renderer.render(
          loaded.bitmap,
          mapped.x,
          mapped.y,
          loaded.width,
          loaded.height,
        );

        const color = sampler.sample(
          loaded.bitmap,
          mapped.x,
          mapped.y,
          loaded.width,
          loaded.height,
        );

        lastColor.r = color.r;
        lastColor.g = color.g;
        lastColor.b = color.b;
        lastColor.hex = color.hex;

        const { left, top } = getMagnifierPosition(
          mouse.clientX,
          mouse.clientY,
          loupeSize,
        );
        overlay.setPosition(left, top);
        overlay.setColor(color.hex);
        overlay.root.style.visibility = "visible";

        onMove?.(
          { r: color.r, g: color.g, b: color.b, hex: color.hex },
          {
            x: mapped.x,
            y: mapped.y,
            clientX: mouse.clientX,
            clientY: mouse.clientY,
          },
        );
      } else {
        // Hide loupe when pointer is outside the image.
        overlay.root.style.visibility = "hidden";
      }
    };

    try {
      loaded = await loadImageSource(source);

      if (settled) {
        loaded.revoke();
        resolve(null);
        return;
      }

      if (!loaded.width || !loaded.height) {
        throw new Error("Image has invalid dimensions.");
      }

      stage = createImageStage(loaded.bitmap, loaded.width, loaded.height);
      overlay = createOverlay();
      renderer = createMagnifierRenderer({
        canvas: overlay.canvas,
        size: magnifierSize,
        sampleSize,
        zoom,
      });
      loupeSize = renderer.size;
      sampler = createColorSampler();
      loop = createAnimationLoop(renderFrame);

      // Seed pointer to image center so loupe appears immediately.
      const rect = stage.display.getBoundingClientRect();
      mouse.clientX = rect.left + rect.width / 2;
      mouse.clientY = rect.top + rect.height / 2;

      window.addEventListener("pointermove", onPointerMove, true);
      window.addEventListener("pointerdown", onPointerDown, true);
      window.addEventListener("click", onClick, true);
      window.addEventListener("keydown", onKeyDown, true);
      window.addEventListener("contextmenu", onContextMenu, true);
      window.addEventListener("wheel", onWheel, {
        capture: true,
        passive: false,
      });
      window.addEventListener("resize", onResize, true);

      loop.start();
      renderFrame();
    } catch (error) {
      cleanup();
      imageActive = false;
      console.error("[eyedropper] Image pick failed:", error);
      onCancel?.();
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

/**
 * @returns {boolean}
 */
export function isImageEyedropperActive() {
  return imageActive;
}
