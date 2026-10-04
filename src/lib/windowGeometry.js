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
