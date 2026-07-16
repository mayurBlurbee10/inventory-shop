/**
 * Imperative circular magnifier renderer.
 * Draws exclusively from the in-memory capture — never the live DOM.
 * The sampled pixel is always at the exact visual center (requires odd sampleSize).
 */

/**
 * @typedef {Object} MagnifierRendererOptions
 * @property {HTMLCanvasElement} canvas
 * @property {number} [size=130] - CSS pixels (loupe diameter)
 * @property {number} [sampleSize=13] - Source region in bitmap pixels (prefer odd)
 * @property {number} [zoom=10]
 */

/**
 * Normalize sample size to an odd integer so one pixel sits on the geometric center.
 * @param {number} sampleSize
 * @returns {number}
 */
function toOddSampleSize(sampleSize) {
  const n = Math.max(3, Math.round(sampleSize) | 0);
  return n % 2 === 0 ? n + 1 : n;
}

/**
 * @param {MagnifierRendererOptions} options
 */
export function createMagnifierRenderer({
  canvas,
  size = 130,
  sampleSize = 13,
  zoom = 10,
}) {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const resolvedSample = toOddSampleSize(sampleSize);

  // Snap canvas CSS size to an integer multiple of sampleSize so every cell
  // is the same width and the center pixel lands on the circle center.
  const cellCss = Math.max(1, Math.round(size / resolvedSample));
  const cssSize = cellCss * resolvedSample;
  const pixelSize = cssSize * dpr;
  const cell = cellCss * dpr;

  canvas.width = pixelSize;
  canvas.height = pixelSize;
  canvas.style.width = `${cssSize}px`;
  canvas.style.height = `${cssSize}px`;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    throw new Error("Could not get magnifier 2d context.");
  }

  const centerIndex = Math.floor(resolvedSample / 2);
  const radius = pixelSize / 2;
  const half = centerIndex;

  /**
   * Render a magnified circular loupe centered on (bitmapX, bitmapY).
   *
   * @param {ImageBitmap|HTMLCanvasElement} bitmap
   * @param {number} bitmapX - Sampled pixel X (center)
   * @param {number} bitmapY - Sampled pixel Y (center)
   * @param {number} bitmapWidth
   * @param {number} bitmapHeight
   */
  function render(bitmap, bitmapX, bitmapY, bitmapWidth, bitmapHeight) {
    ctx.clearRect(0, 0, pixelSize, pixelSize);

    ctx.save();
    ctx.beginPath();
    ctx.arc(radius, radius, radius - dpr, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, pixelSize, pixelSize);

    ctx.imageSmoothingEnabled = false;
    if ("imageSmoothingQuality" in ctx) {
      ctx.imageSmoothingQuality = "low";
    }

    // Place sampled pixel at centerIndex so it sits on the geometric center.
    const idealSx = bitmapX - half;
    const idealSy = bitmapY - half;

    const srcX = Math.max(0, idealSx);
    const srcY = Math.max(0, idealSy);
    const srcRight = Math.min(bitmapWidth, idealSx + resolvedSample);
    const srcBottom = Math.min(bitmapHeight, idealSy + resolvedSample);
    const sw = Math.max(0, srcRight - srcX);
    const sh = Math.max(0, srcBottom - srcY);

    if (sw > 0 && sh > 0) {
      const dx = (srcX - idealSx) * cell;
      const dy = (srcY - idealSy) * cell;
      const dw = sw * cell;
      const dh = sh * cell;
      ctx.drawImage(bitmap, srcX, srcY, sw, sh, dx, dy, dw, dh);
    }

    drawPixelGrid();
    drawCenterPixelBorder();
    ctx.restore();

    drawOuterRing();
  }

  function drawPixelGrid() {
    ctx.save();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.22)";
    ctx.lineWidth = Math.max(1, dpr * 0.5);
    ctx.beginPath();

    for (let i = 1; i < resolvedSample; i++) {
      const p = i * cell + 0.5;
      ctx.moveTo(p, 0);
      ctx.lineTo(p, pixelSize);
      ctx.moveTo(0, p);
      ctx.lineTo(pixelSize, p);
    }

    ctx.stroke();
    ctx.restore();
  }

  function drawCenterPixelBorder() {
    const left = centerIndex * cell;
    const top = centerIndex * cell;
    const dim = cell;

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.lineWidth = Math.max(2, dpr * 1.5);
    ctx.strokeRect(left + 1, top + 1, dim - 2, dim - 2);

    ctx.strokeStyle = "rgba(0, 0, 0, 0.7)";
    ctx.lineWidth = Math.max(1, dpr);
    ctx.strokeRect(left + 2.5, top + 2.5, dim - 5, dim - 5);
    ctx.restore();
  }

  function drawOuterRing() {
    ctx.save();
    ctx.beginPath();
    ctx.arc(radius, radius, radius - dpr * 1.5, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.lineWidth = Math.max(2, dpr * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(radius, radius, radius - dpr * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    ctx.lineWidth = Math.max(1, dpr);
    ctx.stroke();
    ctx.restore();
  }

  function dispose() {
    canvas.width = 0;
    canvas.height = 0;
  }

  return {
    render,
    dispose,
    size: cssSize,
    sampleSize: resolvedSample,
    zoom: cellCss,
    cell,
  };
}
