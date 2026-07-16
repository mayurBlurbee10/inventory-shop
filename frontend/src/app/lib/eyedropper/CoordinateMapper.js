/**
 * Convert pointer coordinates into capture-bitmap pixel coordinates.
 *
 * Uses calibration origin from the viewport (0,0) marker in the frozen capture.
 */

import { clamp } from "./utilities";

/**
 * @typedef {Object} CaptureMetrics
 * @property {number} width
 * @property {number} height
 * @property {number} cssWidth
 * @property {number} cssHeight
 * @property {number} dpr
 * @property {number} [originBitmapX=0]
 * @property {number} [originBitmapY=0]
 */

/**
 * Map a viewport client position to the exact bitmap pixel under the pointer.
 *
 * @param {number} clientX
 * @param {number} clientY
 * @param {CaptureMetrics} capture
 * @returns {{ x: number, y: number }}
 */
export function clientToBitmap(clientX, clientY, capture) {
  const {
    width,
    height,
    cssWidth,
    cssHeight,
    dpr,
    originBitmapX = 0,
    originBitmapY = 0,
  } = capture;

  const scaleX = cssWidth > 0 ? width / cssWidth : dpr;
  const scaleY = cssHeight > 0 ? height / cssHeight : dpr;

  // Viewport (0,0) sits at (originBitmapX, originBitmapY) in the capture.
  const x = Math.floor(originBitmapX + clientX * scaleX);
  const y = Math.floor(originBitmapY + clientY * scaleY);

  return {
    x: clamp(x, 0, Math.max(0, width - 1)),
    y: clamp(y, 0, Math.max(0, height - 1)),
  };
}

/**
 * Source rectangle centered on a bitmap pixel for the magnifier.
 *
 * @param {number} bitmapX
 * @param {number} bitmapY
 * @param {number} sampleSize
 * @param {CaptureMetrics} capture
 * @returns {{ sx: number, sy: number, sw: number, sh: number }}
 */
export function getSourceRect(bitmapX, bitmapY, sampleSize, capture) {
  const half = Math.floor(sampleSize / 2);
  let sx = bitmapX - half;
  let sy = bitmapY - half;

  sx = clamp(sx, 0, Math.max(0, capture.width - sampleSize));
  sy = clamp(sy, 0, Math.max(0, capture.height - sampleSize));

  const sw = Math.min(sampleSize, capture.width - sx);
  const sh = Math.min(sampleSize, capture.height - sy);

  return { sx, sy, sw, sh };
}

/**
 * Place the magnifier so its center sits on the pointer hotspot.
 * System cursor is hidden — the loupe itself is the pointer.
 * Clamps so the loupe + color label stay inside the viewport.
 *
 * @param {number} clientX
 * @param {number} clientY
 * @param {number} size - Magnifier CSS diameter
 * @param {number} [_offsetX] - unused (kept for API compatibility)
 * @param {number} [_offsetY] - unused (kept for API compatibility)
 * @param {number} [labelHeight=28]
 * @returns {{ left: number, top: number }}
 */
export function getMagnifierPosition(
  clientX,
  clientY,
  size,
  _offsetX = 0,
  _offsetY = 0,
  labelHeight = 28,
) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const totalHeight = size + labelHeight;

  // Center the circular loupe on the sample point.
  let left = clientX - size / 2;
  let top = clientY - size / 2;

  if (left < 8) left = 8;
  if (left + size > vw - 8) left = Math.max(8, vw - size - 8);
  if (top < 8) top = 8;
  if (top + totalHeight > vh - 8) {
    top = Math.max(8, vh - totalHeight - 8);
  }

  return { left, top };
}
