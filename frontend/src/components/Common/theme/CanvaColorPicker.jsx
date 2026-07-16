/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from 'react';
import { Sparkles, Copy, Check, ArrowUpDown } from 'lucide-react';
import {
  hsvToRgb,
  rgbToHsv,
  rgbToHsl,
  hslToRgb,
  rgbToHex,
  hexToRgb,
  blendTintShade,
  blendTintShadeVisual,
  getWheelColor,
  colorToState,
  generateHarmonicPalettes,
  angleToHue,
  calculateWheelColor,
  getGradientCenter,
  getStopColor,
  BASE_COLORS,
  STOPS,
} from '@/app/lib/colorUtils';
import { cn } from '@/app/lib/utils';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
} from '@/components/ui/popover';
import EyeDropperButton from '@/components/Common/theme/EyeDropperButton';
import ImageColorPickButton from '@/components/Common/theme/ImageColorPickButton';
import './CanvaPicker.css';

const BASE_WHEEL_DIAMETER = 278;
const BASE_WHEEL_RADIUS = BASE_WHEEL_DIAMETER / 2;
const BASE_BAR_OUTER_WIDTH = 28;
const BASE_BAR_INNER_WIDTH = 16;
const BASE_PICKER_GAP = 20;
const BASE_THUMB_SIZE = 20;
const BASE_THUMB_INNER = 12;
const BASE_THUMB_CENTER = 3;
const BASE_BAR_THUMB_OFFSET = 4;
const BASE_PICKER_OUTER =
  BASE_WHEEL_DIAMETER + BASE_PICKER_GAP + BASE_BAR_OUTER_WIDTH;

const getPickerGeometry = (outerSize) => {
  const fitScale = outerSize / BASE_PICKER_OUTER;
  const wheelDiameter = BASE_WHEEL_DIAMETER * fitScale;
  const wheelRadius = wheelDiameter / 2;
  const barHeight = wheelDiameter;
  const barOuterWidth = BASE_BAR_OUTER_WIDTH * fitScale;
  const barInnerWidth = BASE_BAR_INNER_WIDTH * fitScale;
  const gap = BASE_PICKER_GAP * fitScale;
  const thumbSize = BASE_THUMB_SIZE * fitScale;
  const thumbInner = BASE_THUMB_INNER * fitScale;
  const thumbCenter = BASE_THUMB_CENTER * fitScale;
  const barThumbOffset = BASE_BAR_THUMB_OFFSET * fitScale;
  const thumbHalf = thumbSize / 2;

  return {
    fitScale,
    wheelDiameter,
    wheelRadius,
    barHeight,
    barOuterWidth,
    barInnerWidth,
    gap,
    thumbSize,
    thumbInner,
    thumbCenter,
    barThumbOffset,
    thumbHalf,
  };
};

export function CircularColorPicker({
  maxLightness = 1.0,
  value,
  fallback,
  onChange,
  size = 320,
  compact = false,
  showHexRow = true,
  onEyeDropperOpen,
}) {
  const resolvedValue =
    typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value)
      ? value
      : typeof fallback === 'string' && /^#[0-9A-Fa-f]{6}$/.test(fallback)
        ? fallback
        : value;
  // Core state of the picker
  const [wheelCoords, setWheelCoords] = useState({ x: 0, y: -90 }); // start at pure Red, saturated
  const [ringT, setRingT] = useState(0.5 * maxLightness); // start in middle (pure color, t = 0.5 * maxLightness)

  // -------------------------------------------------------------
  // Parent notification model (root-cause fix for the infinite loop)
  // -------------------------------------------------------------
  // The previous design notified the parent from a useEffect that watched the
  // *derived* `finalHex`. That created an unbreakable feedback loop:
  //
  //   user drag -> setWheelCoords -> finalHex changes -> effect calls onChange
  //     -> parent (ThemeContent) calls setState for BOTH start & end colors
  //     -> new `value` props flow back down -> setColor() runs -> coords change
  //     -> finalHex changes AGAIN (the hex -> coords -> hex round-trip is lossy
  //        and never lands on an exact fixed point) -> effect calls onChange...
  //
  // ...forever, which is "Maximum update depth exceeded".
  //
  // The robust fix is to make notification one-directional and gesture-driven:
  //   * onChange is called ONLY as a direct result of a user interaction
  //     (wheel drag, bar drag, keyboard, or manual hex/RGB entry).
  //   * Incoming `value` prop changes update internal state SILENTLY and never
  //     echo back to the parent.
  // With no "derived-state -> onChange" effect, the cycle cannot form.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Last hex we emitted to (or ingested from) the parent — used to dedupe
  // notifications and to recognise our own value echoes.
  const lastEmittedHexRef = useRef(null);

  // Live mirrors of state so the memoized/rAF callbacks can read the latest
  // values without being re-created (and without capturing stale closures).
  const ringTRef = useRef(ringT);
  const wheelCoordsRef = useRef(wheelCoords);
  useEffect(() => {
    ringTRef.current = ringT;
  }, [ringT]);
  useEffect(() => {
    wheelCoordsRef.current = wheelCoords;
  }, [wheelCoords]);

  // Swatches and History state (persisted in localStorage)
  const [savedSwatches, setSavedSwatches] = useState(() => {
    const saved = localStorage.getItem('ccp_swatches');
    return saved ? JSON.parse(saved) : ['#FF4E00', '#F27D26', '#FFE600', '#00FF85', '#00A3FF', '#7000FF'];
  });

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('ccp_history');
    return saved ? JSON.parse(saved) : ['#FF4E00'];
  });

  // UI state
  const [copiedText, setCopiedText] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Input states for fine-tuning with bidirectional toggling
  const [isHexMode, setIsHexMode] = useState(true);
  const [isHexFocused, setIsHexFocused] = useState(false);
  const [isRgbFocused, setIsRgbFocused] = useState(false);

  const [hexInput, setHexInput] = useState('');
  const [rInput, setRInput] = useState('');
  const [gInput, setGInput] = useState('');
  const [bInput, setBInput] = useState('');

  // Refs for dragging and canvases
  const wheelContainerRef = useRef(null);
  const barContainerRef = useRef(null);
  const wheelCanvasRef = useRef(null);
  const barCanvasRef = useRef(null);

  const isDraggingWheel = useRef(false);
  const isDraggingBar = useRef(false);
  const prevWheelRadiusRef = useRef(BASE_WHEEL_RADIUS);

  const geometry = useMemo(() => getPickerGeometry(size), [size]);
  const {
    wheelDiameter,
    wheelRadius,
    barHeight,
    barOuterWidth,
    barInnerWidth,
    gap,
    thumbSize,
    thumbInner,
    thumbCenter,
    barThumbOffset,
    thumbHalf,
    fitScale,
  } = geometry;

  // -------------------------------------------------------------
  // Derived state calculations
  // -------------------------------------------------------------
  const { wheelColorRgb, hue, saturation } = useMemo(() => {
    const dist = Math.sqrt(wheelCoords.x * wheelCoords.x + wheelCoords.y * wheelCoords.y);
    const r_ratio = Math.min(1, dist / wheelRadius);

    const wHsv = getWheelColor(wheelCoords.x, wheelCoords.y, wheelRadius);

    // calculateWheelColor uses the design-time radius internally
    const normalizedX = wheelCoords.x * (BASE_WHEEL_RADIUS / wheelRadius);
    const normalizedY = wheelCoords.y * (BASE_WHEEL_RADIUS / wheelRadius);
    const wRgb = calculateWheelColor(normalizedX, normalizedY, maxLightness);

    return {
      wheelColorRgb: wRgb,
      hue: wHsv.h,
      saturation: r_ratio,
    };
  }, [wheelCoords, maxLightness, wheelRadius]);

  // Compute final colors using the precise blend of wheelColorRgb and ringT
  const finalRgb = useMemo(() => {
    return blendTintShade(wheelColorRgb, ringT, maxLightness);
  }, [wheelColorRgb, ringT, maxLightness]);

  const finalHex = useMemo(() => rgbToHex(finalRgb), [finalRgb]);

  // -------------------------------------------------------------
  // Synchronize FROM the `value` prop (external changes only).
  // This applies the incoming color to internal state WITHOUT emitting a
  // change back to the parent, so a `value` update can never bounce back out
  // through onChange. The lossy hex -> coords -> hex round-trip is harmless
  // here because we don't react to the resulting `finalHex` change, and the
  // coordinate setters bail out once they reach a stable point.
  // -------------------------------------------------------------
  useEffect(() => {
    if (!resolvedValue) return;
    // While the user is actively dragging, THIS picker is the source of truth.
    // Ignore the parent's echoed value so it can't fight the cursor mid-drag.
    if (isDraggingWheel.current || isDraggingBar.current) return;
    if (resolvedValue.toUpperCase() === finalHex.toUpperCase()) return;
    applyColor(resolvedValue, { emit: false, addToHistory: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedValue]);

  // Sync inputs with final values when NOT actively editing them
  useEffect(() => {
    if (!isHexFocused) {
      setHexInput(finalHex);
    }
  }, [finalHex, isHexFocused]);

  useEffect(() => {
    if (!isRgbFocused) {
      setRInput(finalRgb.r.toString());
      setGInput(finalRgb.g.toString());
      setBInput(finalRgb.b.toString());
    }
  }, [finalRgb, isRgbFocused]);

  useEffect(() => {
    const prevRadius = prevWheelRadiusRef.current;
    if (prevRadius !== wheelRadius && prevRadius > 0) {
      const radiusScale = wheelRadius / prevRadius;
      setWheelCoords((coords) => ({
        x: coords.x * radiusScale,
        y: coords.y * radiusScale,
      }));
    }
    prevWheelRadiusRef.current = wheelRadius;
  }, [wheelRadius]);

  // NOTE: There is intentionally no "finalHex -> onChange" effect. The parent
  // is notified imperatively from the user-gesture handlers only (see
  // emitChange / applyColor below), which is what prevents the render loop.

  // -------------------------------------------------------------
  // Canvas Rendering (Optimized once on mount with integer rounding)
  // -------------------------------------------------------------

  // Render static color-wheel ONCE or on Max Lightness change (High-DPI compatible and guarded against fractional DPR crashes)
  useEffect(() => {
    const canvas = wheelCanvasRef.current;
    if (!canvas) return;

    // Guard against non-integer dpr causing crash with createImageData
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const canvasSize = wheelDiameter;
    const width = Math.round(canvasSize * dpr);
    const height = Math.round(canvasSize * dpr);

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, canvasSize, canvasSize);

      // Clip to a perfect circle with smooth anti-aliased edge
      ctx.beginPath();
      ctx.arc(wheelRadius, wheelRadius, wheelRadius - 0.5, 0, 2 * Math.PI);
      ctx.clip();

      // Fill the background of the wheel with the center color (gray of maxLightness)
      const centerL = Math.round(maxLightness * 255);
      ctx.fillStyle = `rgb(${centerL}, ${centerL}, ${centerL})`;
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      // Draw the 8 radial gradients from bottom to top (index 7 down to 0)
      for (let k = 7; k >= 0; k--) {
        const baseColor = BASE_COLORS[k];
        const center = getGradientCenter(k, wheelRadius);

        const grad = ctx.createRadialGradient(
          center.x, center.y, 0,
          center.x, center.y, wheelRadius
        );

        for (const { stop, pureWeight, alpha } of STOPS) {
          const colorStr = getStopColor(baseColor, maxLightness, pureWeight, alpha);
          grad.addColorStop(stop, colorStr);
        }

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvasSize, canvasSize);
      }
    } catch (err) {
      console.error("Failed to render color wheel via pixel data. Falling back to conic/radial gradients.", err);
      // Fail-safe conic gradient fallback if pixel manipulation fails
      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, width / 2 - 1, 0, 2 * Math.PI);
      ctx.clip();

      // Simple beautiful conic hue gradient with maxLightness center scaling
      const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
      grad.addColorStop(0, `rgba(255, 255, 255, ${maxLightness})`);
      grad.addColorStop(1, 'transparent');

      // Draw hues clockwise
      const conicGrad = ctx.createConicGradient(0, width / 2, height / 2);
      conicGrad.addColorStop(0, 'red');
      conicGrad.addColorStop(0.17, 'yellow');
      conicGrad.addColorStop(0.33, 'lime');
      conicGrad.addColorStop(0.5, 'cyan');
      conicGrad.addColorStop(0.67, 'blue');
      conicGrad.addColorStop(0.83, 'magenta');
      conicGrad.addColorStop(1, 'red');

      ctx.fillStyle = conicGrad;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';
    }
  }, [maxLightness, wheelDiameter, wheelRadius]);

  // Redraw tint-shade-bar only when Hue or Max Lightness changes
  useLayoutEffect(() => {
    const canvas = barCanvasRef.current;
    if (!canvas) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const W = barInnerWidth;
    const H = barHeight;
    
    // Explicitly round to integer dimensions
    const width = Math.round(W * dpr);
    const height = Math.round(H * dpr);
    
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    // Create a vertical linear gradient from top to bottom
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    
    const pureRgb = wheelColorRgb;
    const stopsCount = 50; // Ultra-smooth color interpolation
    for (let i = 0; i <= stopsCount; i++) {
      const ratio = i / stopsCount;
      const t = ratio * maxLightness;
      const rgb = blendTintShadeVisual(pureRgb, t, maxLightness);
      grad.addColorStop(ratio, `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }, [wheelColorRgb, maxLightness, barInnerWidth, barHeight]);

  // -------------------------------------------------------------
  // History + parent-notification helpers
  // -------------------------------------------------------------
  // Save current color to history array
  const saveToHistory = useCallback((hexColor) => {
    setHistory((prev) => {
      const filtered = prev.filter((c) => c !== hexColor);
      const updated = [hexColor, ...filtered].slice(0, 10); // Keep max 10
      localStorage.setItem('ccp_history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Pure recomputation of the resulting hex for a given wheel position + tint.
  // Mirrors the wheelColorRgb -> finalRgb -> finalHex memo chain so a gesture
  // can notify the parent with the exact color synchronously, without waiting
  // for the derived state to recompute on the next render.
  const computeHex = useCallback(
    (coords, t) => {
      const normalizedX = coords.x * (BASE_WHEEL_RADIUS / wheelRadius);
      const normalizedY = coords.y * (BASE_WHEEL_RADIUS / wheelRadius);
      const wRgb = calculateWheelColor(normalizedX, normalizedY, maxLightness);
      const rgb = blendTintShade(wRgb, t, maxLightness);
      return rgbToHex(rgb);
    },
    [wheelRadius, maxLightness],
  );

  // Notify the parent of a USER-driven change. Deduped so we never fire
  // onChange for a color the parent already has. This is the only place that
  // ever calls onChange — prop-driven updates never emit, so no render loop.
  const emitChange = useCallback(
    (coords, t) => {
      const hex = computeHex(coords, t);
      if (hex.toUpperCase() === lastEmittedHexRef.current) return;
      lastEmittedHexRef.current = hex.toUpperCase();
      onChangeRef.current?.(hex);
    },
    [computeHex],
  );

  // Apply a specific hex to internal state. `emit` decides whether the parent
  // is notified: true for user input (hex/RGB fields), false when syncing from
  // the `value` prop.
  const applyColor = useCallback(
    (hexColor, { emit = true, addToHistory = true } = {}) => {
      const rgb = hexToRgb(hexColor);
      if (!rgb) return;
      const hsv = rgbToHsv(rgb);
      const state = colorToState(hsv, wheelRadius);
      const finalT = Math.max(0, Math.min(maxLightness, state.ringT));

      // Bail-out setters so applying an already-current color is a no-op and
      // cannot cause repeated renders.
      setWheelCoords((prev) =>
        prev.x === state.x && prev.y === state.y ? prev : { x: state.x, y: state.y },
      );
      setRingT((prev) => (prev === finalT ? prev : finalT));

      if (emit) {
        emitChange({ x: state.x, y: state.y }, finalT);
      } else {
        // Record the ingested color so we recognise (and don't re-emit) it.
        lastEmittedHexRef.current = computeHex(
          { x: state.x, y: state.y },
          finalT,
        ).toUpperCase();
      }

      if (addToHistory) saveToHistory(hexColor.toUpperCase());
    },
    [wheelRadius, maxLightness, emitChange, computeHex, saveToHistory],
  );

  // Backwards-compatible alias used by the manual input handlers.
  const setColor = useCallback(
    (hexColor) => applyColor(hexColor, { emit: true, addToHistory: true }),
    [applyColor],
  );

  // -------------------------------------------------------------
  // Dragging event handlers with pointer capture
  // -------------------------------------------------------------
  const updateWheelFromCoords = useCallback((x, y) => {
    const dist = Math.sqrt(x * x + y * y);
    let finalX = x;
    let finalY = y;

    // Clamp inside the color wheel radius
    if (dist > wheelRadius) {
      finalX = (x / dist) * wheelRadius;
      finalY = (y / dist) * wheelRadius;
    }

    // Bail out when the coordinates have not actually changed. Returning the
    // previous state object makes React skip the re-render entirely. This is
    // essential during fast dragging (and dragging outside the wheel, where
    // coords are clamped to the same boundary value repeatedly) to avoid a
    // storm of no-op renders that trip "Maximum update depth exceeded".
    setWheelCoords((prev) =>
      prev.x === finalX && prev.y === finalY ? prev : { x: finalX, y: finalY },
    );

    // Notify the parent imperatively (deduped) using the latest tint level.
    emitChange({ x: finalX, y: finalY }, ringTRef.current);
  }, [wheelRadius, emitChange]);

  // requestAnimationFrame throttling for pointer moves: coalesce the many
  // pointermove events fired during a fast drag into at most one state update
  // per animation frame.
  const wheelRafIdRef = useRef(null);
  const pendingWheelCoordsRef = useRef(null);

  const flushWheelCoords = useCallback(() => {
    wheelRafIdRef.current = null;
    const pending = pendingWheelCoordsRef.current;
    if (!pending) return;
    pendingWheelCoordsRef.current = null;
    updateWheelFromCoords(pending.x, pending.y);
  }, [updateWheelFromCoords]);

  useEffect(() => {
    return () => {
      if (wheelRafIdRef.current != null) {
        cancelAnimationFrame(wheelRafIdRef.current);
        wheelRafIdRef.current = null;
      }
    };
  }, []);

  const updateBarFromCoords = useCallback((clientY) => {
    const container = barContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    const ratio = Math.max(0, Math.min(1, relativeY / rect.height));
    const newT = ratio * maxLightness;

    setRingT((prev) => (prev === newT ? prev : newT));
    emitChange(wheelCoordsRef.current, newT);
  }, [maxLightness, emitChange]);

  // Wheel drag handlers
  const handleWheelPointerDown = (e) => {
    const container = wheelContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    container.setPointerCapture(e.pointerId);
    isDraggingWheel.current = true;
    updateWheelFromCoords(x, y);
  };

  const handleWheelPointerMove = (e) => {
    if (!isDraggingWheel.current || !wheelContainerRef.current) return;
    const rect = wheelContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    // Store the latest position and schedule a single flush per frame instead
    // of calling setState on every pointermove event.
    pendingWheelCoordsRef.current = { x, y };
    if (wheelRafIdRef.current == null) {
      wheelRafIdRef.current = requestAnimationFrame(flushWheelCoords);
    }
  };

  const handleWheelPointerUp = (e) => {
    // Make sure the final pointer position is applied before ending the drag,
    // even if it was still queued for the next animation frame.
    if (wheelRafIdRef.current != null) {
      cancelAnimationFrame(wheelRafIdRef.current);
      wheelRafIdRef.current = null;
    }
    if (pendingWheelCoordsRef.current) {
      const { x, y } = pendingWheelCoordsRef.current;
      pendingWheelCoordsRef.current = null;
      updateWheelFromCoords(x, y);
    }

    if (isDraggingWheel.current) {
      saveToHistory(finalHex);
    }
    isDraggingWheel.current = false;
    try {
      wheelContainerRef.current?.releasePointerCapture(e.pointerId);
    } catch (err) {
      // Ignore
    }
  };

  // Bar drag handlers
  const handleBarPointerDown = (e) => {
    const container = barContainerRef.current;
    if (!container) return;

    container.setPointerCapture(e.pointerId);
    isDraggingBar.current = true;
    updateBarFromCoords(e.clientY);
  };

  const handleBarPointerMove = (e) => {
    if (!isDraggingBar.current) return;
    updateBarFromCoords(e.clientY);
  };

  const handleBarPointerUp = (e) => {
    if (isDraggingBar.current) {
      saveToHistory(finalHex);
    }
    isDraggingBar.current = false;
    try {
      barContainerRef.current?.releasePointerCapture(e.pointerId);
    } catch (err) {
      // Ignore
    }
  };

  // Handle Hex Input updates safely to move sliders
  const handleHexInputChange = (val) => {
    setHexInput(val);
    let cleanVal = val.trim();
    if (cleanVal.length > 0 && !cleanVal.startsWith('#')) {
      cleanVal = '#' + cleanVal;
    }
    const isValidHex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(cleanVal);
    if (isValidHex && cleanVal.toUpperCase() !== finalHex.toUpperCase()) {
      setColor(cleanVal);
    }
  };

  // Handle RGB Channel updates safely to move sliders
  const handleRgbInputChange = (channel, val) => {
    if (val === '') {
      if (channel === 'r') setRInput('');
      if (channel === 'g') setGInput('');
      if (channel === 'b') setBInput('');
      return;
    }

    const num = parseInt(val, 10);
    if (isNaN(num) || num < 0 || num > 255) return;

    let nextR = channel === 'r' ? num : parseInt(rInput, 10) || 0;
    let nextG = channel === 'g' ? num : parseInt(gInput, 10) || 0;
    let nextB = channel === 'b' ? num : parseInt(bInput, 10) || 0;

    nextR = Math.max(0, Math.min(255, nextR));
    nextG = Math.max(0, Math.min(255, nextG));
    nextB = Math.max(0, Math.min(255, nextB));

    if (channel === 'r') setRInput(nextR.toString());
    if (channel === 'g') setGInput(nextG.toString());
    if (channel === 'b') setBInput(nextB.toString());

    const nextHex = rgbToHex({ r: nextR, g: nextG, b: nextB });
    if (nextHex.toUpperCase() !== finalHex.toUpperCase()) {
      setColor(nextHex);
    }
  };

  // -------------------------------------------------------------
  // Keyboard Accessibility
  // -------------------------------------------------------------
  const handleWheelKeyDown = (e) => {
    const step = Math.max(1, (e.shiftKey ? 12 : 3) * fitScale);
    let nextX = wheelCoords.x;
    let nextY = wheelCoords.y;

    switch (e.key) {
      case 'ArrowUp':
        nextY -= step;
        e.preventDefault();
        break;
      case 'ArrowDown':
        nextY += step;
        e.preventDefault();
        break;
      case 'ArrowLeft':
        nextX -= step;
        e.preventDefault();
        break;
      case 'ArrowRight':
        nextX += step;
        e.preventDefault();
        break;
      default:
        return;
    }

    updateWheelFromCoords(nextX, nextY);
  };

  const handleBarKeyDown = (e) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    let nextT = ringT;

    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        nextT = Math.max(0, ringT - step * maxLightness);
        e.preventDefault();
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        nextT = Math.min(maxLightness, ringT + step * maxLightness);
        e.preventDefault();
        break;
      default:
        return;
    }

    setRingT((prev) => (prev === nextT ? prev : nextT));
    emitChange(wheelCoordsRef.current, nextT);
  };

  // -------------------------------------------------------------
  // Helper Actions (Save Swatch, Copy, etc.)
  // -------------------------------------------------------------
  const toggleSwatch = () => {
    setSavedSwatches((prev) => {
      let next;
      if (prev.includes(finalHex)) {
        next = prev.filter((c) => c !== finalHex);
        showToast('Color removed from swatches');
      } else {
        next = [...prev, finalHex];
        showToast('Color added to swatches');
      }
      localStorage.setItem('ccp_swatches', JSON.stringify(next));
      return next;
    });
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    showToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedText(null), 1500);
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleHexSubmit = (e) => {
    e.preventDefault();
    const rgb = hexToRgb(hexInput);
    if (rgb) {
      setColor(hexInput);
      showToast('Color updated successfully');
    } else {
      showToast('Invalid hex color format');
    }
  };

  // Compute thumb positions for rendering
  const barY = useMemo(() => {
    const ratio = maxLightness > 0 ? ringT / maxLightness : 0;
    return ratio * barHeight;
  }, [ringT, maxLightness, barHeight]);

  const wheelThumbPos = useMemo(() => {
    return {
      x: wheelRadius + wheelCoords.x,
      y: wheelRadius + wheelCoords.y,
    };
  }, [wheelCoords, wheelRadius]);

  // Harmonies list
  const harmonies = useMemo(() => {
    return generateHarmonicPalettes(finalHex);
  }, [finalHex]);

  return (
    <div
      className={cn(
        "ccp-root flex flex-col items-center justify-center",
        compact ? "w-fit p-0" : "w-full p-2",
      )}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="ccp-toast fixed bottom-6 right-6 z-50 text-foreground text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in transition-all duration-300">
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          <span className="font-semibold tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* ================= MAIN WORKSPACE: COLOR WHEEL + TINT-SHADE BAR (SIDE-BY-SIDE) ================= */}
      <section
        className={cn(
          "ccp-panel relative flex flex-col items-center justify-center",
          compact ? "ccp-panel--compact w-fit border-0 shadow-none" : "w-full p-6 shadow-sm",
        )}
        style={{ maxWidth: compact ? undefined : size + 64 }}
      >
        
        {/* Color picker area (wheel + slider sidebar) */}
        <div
          className={cn(
            "ccp-wheel-workspace",
            compact && "ccp-wheel-workspace--compact",
          )}
          style={compact ? undefined : { width: size, height: size }}
        >
          <div className="flex items-center justify-center" style={{ gap }}>
          {/* 1. Color Wheel Container */}
          <div
            ref={wheelContainerRef}
            onPointerDown={handleWheelPointerDown}
            onPointerMove={handleWheelPointerMove}
            onPointerUp={handleWheelPointerUp}
            className="ccp-wheel relative shadow-[inset_0_2px_6px_rgba(0,0,0,0.06)] flex items-center justify-center"
            style={{
              WebkitUserSelect: 'none',
              width: wheelDiameter,
              height: wheelDiameter,
            }}
          >
            <canvas
              ref={wheelCanvasRef}
              className="absolute inset-0 rounded-full"
              style={{ width: wheelDiameter, height: wheelDiameter }}
            />

            {/* Color Wheel Thumb */}
            <div
              id="ccp-wheel-thumb"
              role="slider"
              aria-label="Inner color wheel. Use arrow keys to select hue and saturation."
              tabIndex={0}
              onKeyDown={handleWheelKeyDown}
              className="ccp-wheel-thumb absolute flex items-center justify-center focus:ring-4 focus:ring-orange-500/30 focus:outline-none transition-[box-shadow] duration-75 shadow-[0_2px_8px_rgba(0,0,0,0.22)]"
              style={{
                backgroundColor: 'white',
                width: thumbSize,
                height: thumbSize,
                left: `${wheelThumbPos.x - thumbHalf}px`,
                top: `${wheelThumbPos.y - thumbHalf}px`,
              }}
            >
              {/* Inner selected color preview inside the handler */}
              <div
                className="rounded-full flex items-center justify-center relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)]"
                style={{
                  backgroundColor: rgbToHex(wheelColorRgb),
                  width: thumbInner,
                  height: thumbInner,
                }}
              >
                {/* Precise center guide dot */}
                <div
                  className="rounded-full bg-background absolute"
                  style={{ width: thumbCenter, height: thumbCenter }}
                />
              </div>
            </div>
          </div>

          {/* 2. Vertical Tint-Shade Bar Container */}
          <div
            ref={barContainerRef}
            onPointerDown={handleBarPointerDown}
            onPointerMove={handleBarPointerMove}
            onPointerUp={handleBarPointerUp}
            className="relative flex items-center justify-center cursor-ns-resize touch-none select-none shrink-0"
            style={{
              WebkitUserSelect: 'none',
              width: barOuterWidth,
              height: barHeight,
            }}
          >
            {/* The Visual Bar */}
            <div
              className="ccp-bar-track relative flex items-center justify-center pointer-events-none"
              style={{ width: barInnerWidth, height: barHeight }}
            >
              <canvas
                ref={barCanvasRef}
                className="w-full h-full rounded-full"
                style={{ width: barInnerWidth, height: barHeight }}
              />
            </div>

            {/* Vertical Slider Thumb */}
            <div
              id="ccp-bar-thumb"
              role="slider"
              aria-label="Tint shade vertical slider. Adjusts brightness/lightness."
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(ringT * 100)}
              tabIndex={0}
              onKeyDown={handleBarKeyDown}
              className="ccp-bar-thumb absolute focus:ring-4 focus:ring-orange-500/30 focus:outline-none transition-[box-shadow] duration-75 shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
              style={{
                backgroundColor: 'white',
                width: thumbSize,
                height: thumbSize,
                left: `${barThumbOffset}px`,
                top: `${barY - thumbHalf}px`,
              }}
            />
          </div>
          </div>
        </div>

        {!compact ? (
          <div className="mt-5 flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-[10px] font-mono text-gray-400 font-bold tracking-tight uppercase select-none">
            <span>H: {Math.round(hue)}°</span>
            <span className="text-gray-200">•</span>
            <span>S: {Math.round(saturation * 100)}%</span>
            <span className="text-gray-200">•</span>
            <span>L: {Math.round(ringT * 100)}%</span>
          </div>
        ) : null}

        {showHexRow ? (
          <>
        <div className={cn("w-full", compact ? "mt-2" : "my-4")} />

        {/* INTEGRATED TOGGLABLE HEX/RGB INPUT PANEL WITH PREVIEW */}
        <div
          className={cn(
            "w-full flex justify-center",
            // Bottom-align so swatch/actions line up with inputs when R/G/B labels sit above
            isHexMode ? "items-center" : "items-end",
            compact ? "ccp-hex-row--compact gap-1" : "gap-1.5",
          )}
        >
          {/* Elegant Color Preview Box (copyable on click) */}
          <button
            type="button"
            onClick={() => copyToClipboard(finalHex, 'HEX')}
            className={cn(
              "ccp-swatch-button rounded-lg relative shadow-inner flex items-center justify-center shrink-0 transition-transform hover:scale-105 active:scale-95 focus:outline-none",
              compact ? "w-8 h-8" : "w-11 h-11",
            )}
            style={{ backgroundColor: finalHex }}
            title="Click to copy HEX"
          >
            {/* Show copy feedback icon */}
            <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
              {copiedText === finalHex ? (
                <Check className="w-4 h-4 text-white drop-shadow-sm stroke-[3px]" />
              ) : (
                <Copy className="w-4 h-4 text-white drop-shadow-sm" />
              )}
            </div>
          </button>

          {/* Togglable Input Block */}
          <div className={cn("min-w-0 shrink-0", isHexMode && (compact ? "w-24" : "w-28"))}>
            {isHexMode ? (
              <div className="ccp-input-shell flex items-center rounded-lg px-2 py-1 font-mono text-[11px] w-full transition-colors focus-within:border-orange-500/50">
                <span className="text-secondary-foreground font-bold mr-1 font-mono select-none">#</span>
                <input
                  type="text"
                  readOnly
                  value={hexInput.replace('#', '')}
                  onChange={(e) => handleHexInputChange(e.target.value)}
                  onFocus={() => setIsHexFocused(true)}
                  onBlur={() => setIsHexFocused(false)}
                  placeholder="FF4E00"
                  maxLength={6}
                  className="w-full bg-transparent border-none text-secondary-foreground focus:outline-none uppercase font-extrabold tracking-wider cursor-default"
                />
              </div>
            ) : (
              <div className="flex items-end justify-center gap-1">
                {/* R */}
                <div className="flex w-9 shrink-0 flex-col items-center">
                  <span className="mb-0.5 select-none font-mono text-[8px] font-bold uppercase text-secondary-foreground leading-none">R</span>
                  <input
                    type="text"
                    readOnly
                    value={rInput}
                    onChange={(e) => handleRgbInputChange('r', e.target.value)}
                    onFocus={() => setIsRgbFocused(true)}
                    onBlur={() => setIsRgbFocused(false)}
                    placeholder="255"
                    maxLength={3}
                    className={cn(
                      "ccp-input-field w-full rounded-md px-0.5 text-center font-mono font-bold text-foreground focus:outline-none cursor-default",
                      compact ? "h-7 py-0 text-[11px]" : "h-9 py-1 text-xs",
                    )}
                  />
                </div>
                {/* G */}
                <div className="flex w-9 shrink-0 flex-col items-center">
                  <span className="mb-0.5 select-none font-mono text-[8px] font-bold uppercase text-muted-foreground leading-none">G</span>
                  <input
                    type="text"
                    readOnly
                    value={gInput}
                    onChange={(e) => handleRgbInputChange('g', e.target.value)}
                    onFocus={() => setIsRgbFocused(true)}
                    onBlur={() => setIsRgbFocused(false)}
                    placeholder="78"
                    maxLength={3}
                    className={cn(
                      "ccp-input-field w-full rounded-md px-0.5 text-center font-mono font-bold text-foreground focus:outline-none cursor-default",
                      compact ? "h-7 py-0 text-[11px]" : "h-9 py-1 text-xs",
                    )}
                  />
                </div>
                {/* B */}
                <div className="flex w-9 shrink-0 flex-col items-center">
                  <span className="mb-0.5 select-none font-mono text-[8px] font-bold uppercase text-muted-foreground leading-none">B</span>
                  <input
                    type="text"
                    readOnly
                    value={bInput}
                    onChange={(e) => handleRgbInputChange('b', e.target.value)}
                    onFocus={() => setIsRgbFocused(true)}
                    onBlur={() => setIsRgbFocused(false)}
                    placeholder="0"
                    maxLength={3}
                    className={cn(
                      "ccp-input-field w-full rounded-md px-0.5 text-center font-mono font-bold text-foreground focus:outline-none cursor-default",
                      compact ? "h-7 py-0 text-[11px]" : "h-9 py-1 text-xs",
                    )}
                  />
                </div>
              </div>
            )}
          </div>

          <EyeDropperButton
            compact={compact}
            className={cn(
              "ccp-icon-button border-0 shadow-none hover:bg-accent/40 shrink-0",
              compact ? "h-7 w-7" : "h-9 w-9",
            )}
            onBeforePick={onEyeDropperOpen}
            onColorPicked={(hex) => setColor(hex)}
          />

          {/* Toggle Button (switch hex/rgb) */}
          <button
            type="button"
            onClick={() => setIsHexMode((prev) => !prev)}
            className={cn(
              "ccp-icon-button flex items-center justify-center rounded-lg hover:bg-accent/40 text-muted-foreground hover:text-foreground transition-all shrink-0 active:scale-95",
              compact ? "w-7 h-7" : "w-9 h-9",
            )}
            title={isHexMode ? "Switch to RGB Mode" : "Switch to HEX Mode"}
          >
            <ArrowUpDown className={compact ? "w-3 h-3" : "w-4 h-4"} />
          </button>
        </div>
          </>
        ) : null}

      </section>
    </div>
  );
}

const isValidHexColor = (value) => /^#[0-9A-F]{6}$/i.test(value);

const normalizeHexColor = (value, fallback = "#3B82F6") =>
  isValidHexColor(value) ? value.toUpperCase() : fallback.toUpperCase();

const releaseBodyScrollLock = () => {
  if (typeof document === "undefined") return;
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
  document.body.style.pointerEvents = "";
  document.documentElement.style.overflow = "";
  document.documentElement.style.paddingRight = "";
};

const getSingleWheelSize = () => {
  if (typeof window === "undefined") return 250;
  if (window.innerWidth < 420) return 132;
  if (window.innerWidth < 640) return 160;
  return 250;
};

/**
 * Swatch + hex + screen eyedropper + native color input for single primary colors.
 * Used by ThemeContent as the default export of this module.
 *
 * NOTE: Custom CircularColorPicker wheel is temporarily commented out in favor of
 * input type="color". Existing wheel code is preserved below (commented).
 */
export default function ColorPickerPopover({
  label = "Primary Color",
  pickerLabel = "Pick a color",
  value,
  fallback = "#3B82F6",
  onChange,
  maxLightness = 1,
  className,
}) {
  // --- Custom wheel popover state (kept for restore) ---
  // const [open, setOpen] = useState(false);
  // const [wheelSize, setWheelSize] = useState(250);
  // const anchorRef = useRef(null);

  const color = normalizeHexColor(value, fallback);

  // const handleOpenChange = (nextOpen) => {
  //   setOpen(nextOpen);
  //   if (!nextOpen) releaseBodyScrollLock();
  // };

  // const closePicker = () => {
  //   setOpen(false);
  //   releaseBodyScrollLock();
  // };

  // const openPicker = (element) => {
  //   anchorRef.current = element;
  //   setOpen(true);
  // };

  // useEffect(() => () => releaseBodyScrollLock(), []);

  // useEffect(() => {
  //   if (!open) return;
  //   setWheelSize(getSingleWheelSize());
  // }, [open]);

  const handleColorChange = (next) => {
    const nextHex = normalizeHexColor(next, color);
    onChange?.(nextHex);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <Label className="block text-sm font-semibold text-foreground">
          {label}
        </Label>
      ) : null}

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        {/* --- Native color input + eyedropper (custom wheel commented out) --- */}
        <div className="flex flex-wrap items-center gap-3">
          <label
            className="flex cursor-pointer items-center gap-2 rounded-lg p-1 transition-colors hover:bg-accent/50 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary"
            aria-label={`${pickerLabel}: ${color}`}
          >
            <input
              type="color"
              value={color}
              onChange={(event) => handleColorChange(event.target.value)}
              className="h-10 w-10 cursor-pointer overflow-hidden rounded-lg border border-black/10 bg-transparent p-0 shadow-sm [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:rounded-lg [&::-moz-color-swatch]:border-none"
            />
            <div className="min-w-0 text-left">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {pickerLabel}
              </p>
              <p className="truncate font-mono text-xs font-semibold text-foreground">
                {color}
              </p>
            </div>
          </label>

          {/* Screen eyedropper trigger — temporarily hidden; feature kept in EyeDropperButton */}
          {/* <EyeDropperButton
            onColorPicked={handleColorChange}
            label="Pick primary color from screen"
          /> */}

          <ImageColorPickButton
            onColorPicked={handleColorChange}
            label="Pick from Image"
          />
        </div>

        {/* --- Previous custom color wheel popover (commented out, do not delete) ---
        <Popover open={open} onOpenChange={handleOpenChange}>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={(event) => openPicker(event.currentTarget)}
              className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`${pickerLabel}: ${color}`}
            >
              <span
                className="h-10 w-10 shrink-0 rounded-lg border border-black/10 shadow-sm"
                style={{ backgroundColor: color }}
              />
              <div className="min-w-0 text-left">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {pickerLabel}
                </p>
                <p className="truncate font-mono text-xs font-semibold text-foreground">
                  {color}
                </p>
              </div>
            </button>

            <EyeDropperButton
              onBeforePick={closePicker}
              onColorPicked={handleColorChange}
              label="Pick primary color from screen"
            />

            <ImageColorPickButton
              onBeforePick={closePicker}
              onColorPicked={handleColorChange}
              label="Upload a photo, then click a pixel to pick the primary color"
              buttonText="Pick from photo"
              hint="Upload an image, then click any pixel to sample its color."
            />
          </div>

          <PopoverContent
            anchor={anchorRef}
            initialFocus={false}
            className="z-40 !w-auto !max-w-[calc(100vw-1.5rem)] w-fit overflow-hidden rounded-xl border-border bg-popover !p-3 shadow-lg"
            style={{ width: "fit-content", maxWidth: "none" }}
          >
            <CircularColorPicker
              value={color}
              fallback={fallback}
              onChange={handleColorChange}
              onEyeDropperOpen={closePicker}
              size={wheelSize}
              showHexRow
              compact
              maxLightness={maxLightness}
            />
          </PopoverContent>
        </Popover>
        --- end previous custom wheel --- */}
      </div>
    </div>
  );
}