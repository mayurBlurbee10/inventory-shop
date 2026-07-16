/**
 * High-performance eyedropper magnifier.
 *
 * Per session (pipette click → pick/cancel):
 *   fresh screen capture → keep in memory for that session only → rAF loupe.
 * Snapshots are never reused across sessions.
 * Never zooms the live DOM.
 */

export { startEyedropper, isEyedropperActive } from "./EyedropperController";
export {
  startImageEyedropper,
  isImageEyedropperActive,
  clientToImageBitmap,
} from "./ImageEyedropper";
export { captureScreen } from "./ScreenCapture";
export {
  clientToBitmap,
  getSourceRect,
  getMagnifierPosition,
} from "./CoordinateMapper";
export { createColorSampler } from "./ColorSampler";
export { createMagnifierRenderer } from "./MagnifierRenderer";
export { createOverlay } from "./OverlayManager";
export { createAnimationLoop } from "./AnimationLoop";
export {
  rgbToHex,
  hexToRgb,
  getDevicePixelRatio,
  clamp,
} from "./utilities";
