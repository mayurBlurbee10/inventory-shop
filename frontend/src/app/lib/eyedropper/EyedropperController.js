/**
 * EyedropperController — one session = pipette click → pick color (or cancel).
 *
 * Each session always captures a brand-new screen snapshot.
 * Snapshots are never reused across sessions; previous capture is disposed on exit.
 *
 * Public entry: startEyedropper(options) → Promise<string|null>
 *
 * NOTE: Do not change position-mapping math here — that lives in CoordinateMapper /
 * MagnifierRenderer and must stay stable.
 */

import { captureScreen } from "./ScreenCapture";
import { clientToBitmap, getMagnifierPosition } from "./CoordinateMapper";
import { createColorSampler } from "./ColorSampler";
import { createMagnifierRenderer } from "./MagnifierRenderer";
import { createOverlay } from "./OverlayManager";
import { createAnimationLoop } from "./AnimationLoop";

/** @type {boolean} */
let active = false;

/** @type {number} */
let sessionSerial = 0;

/** Last session capture — disposed before every new session starts. */
/** @type {{ dispose: () => void } | null} */
let previousCapture = null;

/**
 * @typedef {Object} EyedropperOptions
 * @property {number} [zoom=10]
 * @property {number} [magnifierSize=130]
 * @property {number} [sampleSize=13]
 * @property {(color: { r: number, g: number, b: number, hex: string }, position: { x: number, y: number, clientX: number, clientY: number }) => void} [onMove]
 * @property {(color: string) => void} [onPick]
 * @property {() => void} [onCancel]
 */

/**
 * Drop any leftover capture from a prior session so the next capture is never reused.
 */
function disposePreviousCapture() {
  if (!previousCapture) return;
  try {
    previousCapture.dispose();
  } catch {
    // ignore dispose errors from already-closed ImageBitmaps
  }
  previousCapture = null;
}

/**
 * Start a new eyedropper session.
 * Session lifetime: pipette click → click to pick (or Esc / right-click cancel).
 * Always takes a fresh html2canvas snapshot at session start.
 *
 * @param {EyedropperOptions} [options]
 * @returns {Promise<string|null>} HEX on pick, null on cancel.
 */
export function startEyedropper(options = {}) {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Eyedropper requires a browser environment."),
    );
  }

  if (active) {
    return Promise.reject(new Error("Eyedropper is already active."));
  }

  // Guarantee no leftover bitmap can leak into this session.
  disposePreviousCapture();

  const {
    zoom = 10,
    magnifierSize = 130,
    sampleSize = 13,
    onMove,
    onPick,
    onCancel,
  } = options;

  const resolvedSample =
    sampleSize || Math.max(1, Math.round(magnifierSize / zoom));
  const resolvedZoom = zoom || magnifierSize / resolvedSample;

  const sessionId = ++sessionSerial;
  active = true;

  return new Promise(async (resolve, reject) => {
    let capture = null;
    let overlay = null;
    let renderer = null;
    let sampler = null;
    let loop = null;
    let loupeSize = magnifierSize;
    let settled = false;

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
      active = false;

      document.documentElement.style.overflow = previousOverflow;

      window.removeEventListener("pointermove", onPointerMove, true);
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("pointerup", onPointerUp, true);
      window.removeEventListener("mousedown", onMouseDown, true);
      window.removeEventListener("mouseup", onMouseUp, true);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("auxclick", onClick, true);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("contextmenu", onContextMenu, true);
      window.removeEventListener("wheel", onWheel, true);

      loop?.stop();
      renderer?.dispose();
      sampler?.dispose();
      overlay?.dispose();

      // Destroy this session's snapshot so the next session cannot reuse it.
      if (capture) {
        try {
          capture.dispose();
        } catch {
          // ignore
        }
        if (previousCapture === capture) {
          previousCapture = null;
        }
        capture = null;
      }

      loop = null;
      renderer = null;
      sampler = null;
      overlay = null;
    };

    const finishPick = () => {
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

    /** Stop the event completely so underlying buttons/links never activate. */
    const blockEvent = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
    };

    const onPointerMove = (event) => {
      mouse.clientX = event.clientX;
      mouse.clientY = event.clientY;
      loop?.requestFrame();
    };

    const onPointerDown = (event) => {
      blockEvent(event);
      if (event.button === 2) {
        finishCancel();
        return;
      }
      if (event.button === 0) {
        finishPick();
      }
    };

    const onPointerUp = (event) => {
      blockEvent(event);
    };

    const onMouseDown = (event) => {
      blockEvent(event);
    };

    const onMouseUp = (event) => {
      blockEvent(event);
    };

    const onClick = (event) => {
      blockEvent(event);
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        blockEvent(event);
        finishCancel();
      }
    };

    const onContextMenu = (event) => {
      blockEvent(event);
    };

    const onWheel = (event) => {
      blockEvent(event);
    };

    const renderFrame = () => {
      if (!capture || !renderer || !sampler || !overlay) return;
      // Stale session guard (should not happen; keeps leftover rAF safe).
      if (sessionId !== sessionSerial) return;

      const { x: bitmapX, y: bitmapY } = clientToBitmap(
        mouse.clientX,
        mouse.clientY,
        capture,
      );

      renderer.render(
        capture.bitmap,
        bitmapX,
        bitmapY,
        capture.width,
        capture.height,
      );

      const color = sampler.sample(
        capture.bitmap,
        bitmapX,
        bitmapY,
        capture.width,
        capture.height,
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

      onMove?.(
        { r: color.r, g: color.g, b: color.b, hex: color.hex },
        {
          x: bitmapX,
          y: bitmapY,
          clientX: mouse.clientX,
          clientY: mouse.clientY,
        },
      );
    };

    try {
      // Let caller overlays (color wheel, popovers) unmount before capture.
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(r)),
      );
      await new Promise((r) => setTimeout(r, 120));

      if (settled || sessionId !== sessionSerial) {
        resolve(null);
        return;
      }

      // --- NEW snapshot for THIS session only (never reuse previous) ---
      disposePreviousCapture();
      capture = await captureScreen({
        sessionId,
        ignoreElements: (el) =>
          el?.getAttribute?.("data-eyedropper-overlay") === "true",
      });
      previousCapture = capture;

      if (settled || sessionId !== sessionSerial) {
        capture.dispose();
        if (previousCapture === capture) previousCapture = null;
        capture = null;
        resolve(null);
        return;
      }

      overlay = createOverlay();
      renderer = createMagnifierRenderer({
        canvas: overlay.canvas,
        size: magnifierSize,
        sampleSize: resolvedSample,
        zoom: resolvedZoom,
      });
      loupeSize = renderer.size;
      sampler = createColorSampler();
      loop = createAnimationLoop(renderFrame);

      window.addEventListener("pointermove", onPointerMove, true);
      window.addEventListener("pointerdown", onPointerDown, true);
      window.addEventListener("pointerup", onPointerUp, true);
      window.addEventListener("mousedown", onMouseDown, true);
      window.addEventListener("mouseup", onMouseUp, true);
      window.addEventListener("click", onClick, true);
      window.addEventListener("auxclick", onClick, true);
      window.addEventListener("keydown", onKeyDown, true);
      window.addEventListener("contextmenu", onContextMenu, true);
      window.addEventListener("wheel", onWheel, {
        capture: true,
        passive: false,
      });

      loop.start();
      renderFrame();
    } catch (error) {
      cleanup();
      active = false;
      console.error("[eyedropper] Failed to start:", error);
      onCancel?.();
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

/**
 * Whether an eyedropper session is currently running.
 * @returns {boolean}
 */
export function isEyedropperActive() {
  return active;
}
