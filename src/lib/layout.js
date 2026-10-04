import { MIN_WINDOW_SIZE } from "./windowGeometry.js";

/**
 * Layout metrics live in CSS tokens (site.tokens.css). This module reads them at runtime and
 * does the tiling arithmetic, so no spacing numbers are hardcoded in components.
 */

/**
 * @typedef {{ width: number, height: number }} Size
 * @typedef {{ x: number, y: number, width: number, height: number }} Rect
 * @typedef {{ tileMargin: number, tileGap: number }} LayoutTokens
 */

/**
 * Reads a custom property holding a plain px length (for example `20px`).
 * @param {CSSStyleDeclaration} styles
 * @param {string} name
 * @returns {number} 0 when the property is missing or not a number
 */
export function readPxToken(styles, name) {
  const value = Number.parseFloat(styles.getPropertyValue(name));
  return Number.isFinite(value) ? value : 0;
}

/**
 * @param {Element} [root] element whose computed styles carry the tokens
 * @returns {LayoutTokens}
 */
export function readLayoutTokens(root = document.documentElement) {
  const styles = getComputedStyle(root);
  return { tileMargin: readPxToken(styles, "--tile-margin"), tileGap: readPxToken(styles, "--tile-gap") };
}

/**
 * Size of the box a window is positioned in (the desktop surface), falling back to the
 * browser viewport when the element has no layout box.
 * @param {HTMLElement} windowEl
 * @returns {Size}
 */
export function measureBounds(windowEl) {
  const parent = windowEl.offsetParent;
  if (parent instanceof HTMLElement && parent.clientWidth > 0 && parent.clientHeight > 0) {
    return { width: parent.clientWidth, height: parent.clientHeight };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * Splits `surface` into a near-square grid of `count` cells with `tileMargin` around the
 * edge and `tileGap` between neighbours. Every rect honours the minimum window size.
 * @param {number} count
 * @param {Size} surface
 * @param {LayoutTokens} tokens
 * @returns {Rect[]}
 */
export function computeTileLayout(count, surface, tokens) {
  if (count <= 0) return [];
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const cellWidth = Math.floor((surface.width - 2 * tokens.tileMargin) / cols);
  const cellHeight = Math.floor((surface.height - 2 * tokens.tileMargin) / rows);
  return Array.from({ length: count }, (_, i) => ({
    x: tokens.tileMargin + (i % cols) * cellWidth,
    y: tokens.tileMargin + Math.floor(i / cols) * cellHeight,
    width: Math.max(MIN_WINDOW_SIZE.width, cellWidth - tokens.tileGap),
    height: Math.max(MIN_WINDOW_SIZE.height, cellHeight - tokens.tileGap),
  }));
}
