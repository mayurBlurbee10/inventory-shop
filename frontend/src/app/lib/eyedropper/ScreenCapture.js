/**
 * Screen capture for one eyedropper session.
 *
 * Session = pipette click → pick color (or cancel).
 * Every call to captureScreen() produces a brand-new snapshot.
 * Within a session the magnifier reuses that in-memory bitmap (never re-captures
 * on mousemove). Across sessions the previous bitmap is disposed and a new one
 * is taken.
 *
 * Calibration: a 1px marker at viewport (0,0) is located in the bitmap so
 * pointer ↔ pixel mapping stays exact.
 */

import html2canvas from "html2canvas";
import { getDevicePixelRatio } from "./utilities";

const MARKER_RGB = { r: 255, g: 0, b: 128 };

/**
 * @typedef {Object} ScreenCaptureResult
 * @property {ImageBitmap|HTMLCanvasElement} bitmap
 * @property {number} width
 * @property {number} height
 * @property {number} cssWidth
 * @property {number} cssHeight
 * @property {number} dpr
 * @property {number} originBitmapX - Bitmap X of viewport client (0,0)
 * @property {number} originBitmapY - Bitmap Y of viewport client (0,0)
 * @property {() => void} dispose
 */

/**
 * @returns {{ remove: () => void }}
 */
function placeCalibrationMarker() {
  const el = document.createElement("div");
  el.setAttribute("data-eyedropper-calibration", "true");
  Object.assign(el.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: "1px",
    height: "1px",
    background: `rgb(${MARKER_RGB.r},${MARKER_RGB.g},${MARKER_RGB.b})`,
    zIndex: "2147483645",
    pointerEvents: "none",
    opacity: "1",
    margin: "0",
    padding: "0",
    border: "none",
  });
  document.body.appendChild(el);
  return {
    remove() {
      if (el.parentNode) el.parentNode.removeChild(el);
    },
  };
}

/**
 * Find where the calibration marker landed in the captured bitmap.
 *
 * @param {HTMLCanvasElement|ImageBitmap} bitmap
 * @param {number} width
 * @param {number} height
 * @returns {{ x: number, y: number }}
 */
function findCalibrationOrigin(bitmap, width, height) {
  const search = Math.min(96, width, height);
  const canvas = document.createElement("canvas");
  canvas.width = search;
  canvas.height = search;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { x: 0, y: 0 };

  ctx.drawImage(bitmap, 0, 0, search, search, 0, 0, search, search);
  const data = ctx.getImageData(0, 0, search, search).data;

  for (let y = 0; y < search; y++) {
    for (let x = 0; x < search; x++) {
      const i = (y * search + x) * 4;
      if (
        data[i] === MARKER_RGB.r &&
        data[i + 1] === MARKER_RGB.g &&
        data[i + 2] === MARKER_RGB.b
      ) {
        return { x, y };
      }
    }
  }

  return { x: 0, y: 0 };
}

/**
 * Capture a brand-new viewport snapshot. Never cached across eyedropper sessions.
 *
 * @param {Object} [options]
 * @param {(el: Element) => boolean} [options.ignoreElements]
 * @param {number|string} [options.sessionId] - optional session token (busts any reuse)
 * @returns {Promise<ScreenCaptureResult>}
 */
export async function captureScreen(options = {}) {
  const dpr = getDevicePixelRatio();
  const cssWidth = window.innerWidth;
  const cssHeight = window.innerHeight;
  const scrollX = window.scrollX || window.pageXOffset || 0;
  const scrollY = window.scrollY || window.pageYOffset || 0;

  // Unique per call — session-scoped capture identity (not used in mapping math).
  const captureToken =
    options.sessionId != null
      ? String(options.sessionId)
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const marker = placeCalibrationMarker();

  try {
    const canvas = await html2canvas(document.documentElement, {
      useCORS: true,
      allowTaint: true,
      logging: false,
      // Force asset URLs to reload so this session cannot inherit a stale canvas.
      cacheBust: true,
      scale: dpr,
      backgroundColor: "#ffffff",
      width: cssWidth,
      height: cssHeight,
      windowWidth: cssWidth,
      windowHeight: cssHeight,
      x: scrollX,
      y: scrollY,
      scrollX: 0,
      scrollY: 0,
      ignoreElements: (el) => {
        if (el?.getAttribute?.("data-eyedropper-overlay") === "true") {
          return true;
        }
        if (options.ignoreElements?.(el)) return true;
        return false;
      },
    });

    let bitmap = /** @type {ImageBitmap|HTMLCanvasElement} */ (canvas);
    const width = bitmap.width || canvas.width;
    const height = bitmap.height || canvas.height;

    const { x: originBitmapX, y: originBitmapY } = findCalibrationOrigin(
      bitmap,
      width,
      height,
    );

    let disposed = false;

    if (typeof createImageBitmap === "function") {
      try {
        // Fresh ImageBitmap from this session's canvas only.
        bitmap = await createImageBitmap(canvas);
      } catch {
        bitmap = canvas;
      }
    }

    return {
      bitmap,
      width: bitmap.width || width,
      height: bitmap.height || height,
      cssWidth,
      cssHeight,
      dpr,
      originBitmapX,
      originBitmapY,
      captureToken,
      dispose() {
        if (disposed) return;
        disposed = true;
        if (bitmap && typeof bitmap.close === "function") {
          bitmap.close();
        }
        // Drop canvas backing store when we still hold the raw canvas.
        if (bitmap && bitmap instanceof HTMLCanvasElement) {
          bitmap.width = 0;
          bitmap.height = 0;
        }
        if (canvas && canvas !== bitmap) {
          canvas.width = 0;
          canvas.height = 0;
        }
      },
    };
  } finally {
    marker.remove();
  }
}
