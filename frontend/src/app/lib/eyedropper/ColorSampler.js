/**
 * Sample a single pixel from an in-memory capture (never from the live DOM).
 */

import { rgbToHex } from "./utilities";

/**
 * Allocates a reusable 1×1 canvas used to read the center pixel each frame.
 */
export function createColorSampler() {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", {
    willReadFrequently: true,
    alpha: false,
  });

  if (!ctx) {
    throw new Error("Could not create color sampler context.");
  }

  ctx.imageSmoothingEnabled = false;

  // Reusable color object — mutate in place to avoid allocations per frame.
  const color = {
    r: 0,
    g: 0,
    b: 0,
    hex: "#000000",
  };

  /**
   * Read the exact pixel at (bitmapX, bitmapY) from the capture bitmap.
   *
   * @param {ImageBitmap|HTMLCanvasElement} bitmap
   * @param {number} bitmapX
   * @param {number} bitmapY
   * @param {number} bitmapWidth
   * @param {number} bitmapHeight
   * @returns {{ r: number, g: number, b: number, hex: string }}
   */
  function sample(bitmap, bitmapX, bitmapY, bitmapWidth, bitmapHeight) {
    const x = Math.max(0, Math.min(bitmapWidth - 1, bitmapX | 0));
    const y = Math.max(0, Math.min(bitmapHeight - 1, bitmapY | 0));

    ctx.clearRect(0, 0, 1, 1);
    ctx.drawImage(bitmap, x, y, 1, 1, 0, 0, 1, 1);

    const data = ctx.getImageData(0, 0, 1, 1).data;
    color.r = data[0];
    color.g = data[1];
    color.b = data[2];
    color.hex = rgbToHex(color.r, color.g, color.b);
    return color;
  }

  function dispose() {
    canvas.width = 0;
    canvas.height = 0;
  }

  return { sample, dispose, canvas };
}
