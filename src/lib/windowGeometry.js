/**
 * Pure geometry helpers for desktop windows. The viewport is always passed in,
 * so nothing here reads the DOM.
 */

/** Smallest a window may be resized to. */
export const MIN_WINDOW_SIZE = Object.freeze({ width: 240, height: 160 });

/**
 * @typedef {{ width: number, height: number }} Size
 * @typedef {{ x: number, y: number }} Point
 */

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number} `value` limited to [min, max]; `min` wins when the range is inverted
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

/**
 * Keeps a window of `size` fully inside `viewport` (a window larger than the viewport pins to 0).
 * @param {Point} position
 * @param {Size} size
 * @param {Size} viewport
 * @returns {Point}
 */
export function clampPosition(position, size, viewport) {
  return {
    x: clamp(position.x, 0, viewport.width - size.width),
    y: clamp(position.y, 0, viewport.height - size.height),
  };
}

/**
 * Applies the minimum size and stops the window growing past the viewport edge from its origin.
 * @param {Size} size
 * @param {Point} origin top-left corner of the window
 * @param {Size} viewport
 * @returns {Size}
 */
export function clampSize(size, origin, viewport) {
  return {
    width: clamp(size.width, MIN_WINDOW_SIZE.width, Math.max(MIN_WINDOW_SIZE.width, viewport.width - origin.x)),
    height: clamp(size.height, MIN_WINDOW_SIZE.height, Math.max(MIN_WINDOW_SIZE.height, viewport.height - origin.y)),
  };
}

/** Arrow keys that move or resize a window from the keyboard, as unit vectors. */
const ARROW_VECTORS = Object.freeze({
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
});

/**
 * Keyboard move and resize. An arrow key moves the window by `step`; with Shift it resizes
 * instead. The result stays inside `viewport` and above the minimum size.
 * @param {{ x: number, y: number, width: number, height: number }} rect
 * @param {{ key: string, shiftKey: boolean }} press
 * @param {number} step distance in px
 * @param {Size} viewport
 * @returns {{ kind: "move", x: number, y: number } | { kind: "resize", width: number, height: number } | null} null for any other key
 */
export function applyKeyboardGesture(rect, press, step, viewport) {
  if (!Object.hasOwn(ARROW_VECTORS, press.key)) return null;
  const [dx, dy] = ARROW_VECTORS[/** @type {keyof typeof ARROW_VECTORS} */ (press.key)];
  if (press.shiftKey) {
    const size = clampSize(
      { width: rect.width + dx * step, height: rect.height + dy * step },
      { x: rect.x, y: rect.y },
      viewport,
    );
    return { kind: "resize", ...size };
  }
  const position = clampPosition({ x: rect.x + dx * step, y: rect.y + dy * step }, rect, viewport);
  return { kind: "move", ...position };
}
