/**
 * requestAnimationFrame loop driven by the latest mouse position.
 * Mouse events only update coordinates; all drawing happens here.
 */

/**
 * @param {(timestamp: number) => void} onFrame
 * @returns {{ start: Function, stop: Function, requestFrame: Function, isRunning: Function }}
 */
export function createAnimationLoop(onFrame) {
  let rafId = 0;
  let running = false;
  let pending = false;

  function frame(timestamp) {
    rafId = 0;
    pending = false;
    if (!running) return;
    onFrame(timestamp);
  }

  /** Schedule a single frame if one is not already queued. */
  function requestFrame() {
    if (!running || pending) return;
    pending = true;
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    running = true;
    requestFrame();
  }

  function stop() {
    running = false;
    pending = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  function isRunning() {
    return running;
  }

  return { start, stop, requestFrame, isRunning };
}
