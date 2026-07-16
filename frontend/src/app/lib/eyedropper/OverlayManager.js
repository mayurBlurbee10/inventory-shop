/**
 * DOM overlay for the eyedropper loupe.
 * Imperative only — never drives React re-renders on mouse move.
 *
 * Includes a full-viewport hit shield so underlying buttons/links cannot
 * receive clicks while eyedropper is active. System cursor is hidden —
 * the magnifier itself is the pointer.
 */

/**
 * @typedef {Object} OverlayElements
 * @property {HTMLDivElement} root
 * @property {HTMLDivElement} shield - Blocks page interaction
 * @property {HTMLCanvasElement} canvas
 * @property {HTMLDivElement} label
 * @property {HTMLDivElement} swatch
 * @property {HTMLSpanElement} hexText
 */

/**
 * Create a fixed, max-z-index overlay hosting the magnifier canvas + color label.
 *
 * @returns {OverlayElements & { setPosition: Function, setColor: Function, dispose: Function }}
 */
export function createOverlay() {
  const root = document.createElement("div");
  root.setAttribute("data-eyedropper-overlay", "true");
  Object.assign(root.style, {
    position: "fixed",
    inset: "0",
    zIndex: "2147483647",
    pointerEvents: "none",
    userSelect: "none",
  });

  // Full-screen shield blocks page UI; cursor hidden — loupe is the pointer.
  const shield = document.createElement("div");
  shield.setAttribute("data-eyedropper-shield", "true");
  Object.assign(shield.style, {
    position: "fixed",
    inset: "0",
    zIndex: "0",
    pointerEvents: "auto",
    cursor: "none",
    background: "transparent",
    touchAction: "none",
  });

  const loupe = document.createElement("div");
  Object.assign(loupe.style, {
    position: "fixed",
    left: "0",
    top: "0",
    zIndex: "1",
    pointerEvents: "none",
    willChange: "transform",
    alignItems: "center",
    transform: "translate3d(-9999px, -9999px, 0)",
  });

  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, {
    display: "block",
    borderRadius: "50%",
    boxShadow: "0 8px 28px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.12)",
    cursor: "none",
  });

  const label = document.createElement("div");
  Object.assign(label.style, {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "8px",
    marginLeft: "22px",
    padding: "4px 8px",
    borderRadius: "8px",
    background: "rgba(20, 20, 20, 0.88)",
    color: "#fff",
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: "12px",
    lineHeight: "1",
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
    width: "max-content",
    maxWidth: "100%",
    cursor: "none",
  });

  const swatch = document.createElement("div");
  Object.assign(swatch.style, {
    width: "14px",
    height: "14px",
    borderRadius: "3px",
    border: "1px solid rgba(255,255,255,0.55)",
    flexShrink: "0",
    background: "#000000",
  });

  const hexText = document.createElement("span");
  hexText.textContent = "#000000";

  // Hide system cursor everywhere — magnifier is the only pointer.
  const styleEl = document.createElement("style");
  styleEl.setAttribute("data-eyedropper-cursor-style", "true");
  styleEl.textContent = `
    html.eyedropper-session-active,
    html.eyedropper-session-active * {
      cursor: none !important;
    }
  `;
  document.head.appendChild(styleEl);
  document.documentElement.classList.add("eyedropper-session-active");

  label.appendChild(swatch);
  label.appendChild(hexText);
  loupe.appendChild(canvas);
  loupe.appendChild(label);
  root.appendChild(shield);
  root.appendChild(loupe);
  document.body.appendChild(root);

  const previousCursor = document.documentElement.style.cursor;
  document.documentElement.style.cursor = "none";

  /**
   * @param {number} left
   * @param {number} top
   */
  function setPosition(left, top) {
    loupe.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
  }

  /**
   * @param {string} hex
   */
  function setColor(hex) {
    swatch.style.background = hex;
    hexText.textContent = hex;
  }

  function dispose() {
    document.documentElement.classList.remove("eyedropper-session-active");
    document.documentElement.style.cursor = previousCursor;
    if (styleEl.parentNode) {
      styleEl.parentNode.removeChild(styleEl);
    }
    if (root.parentNode) {
      root.parentNode.removeChild(root);
    }
  }

  return {
    root,
    shield,
    canvas,
    label,
    swatch,
    hexText,
    setPosition,
    setColor,
    dispose,
  };
}
