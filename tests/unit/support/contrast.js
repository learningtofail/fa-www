/** WCAG 2.x contrast helpers used by the token contrast tests. */

/**
 * @param {string} hex `#rgb` or `#rrggbb`
 * @returns {[number, number, number]} channels 0-255
 */
export function parseHex(hex) {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(h)) throw new Error(`not a hex color: ${hex}`);
  return /** @type {[number, number, number]} */ ([0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)));
}

/**
 * @param {string} hex
 * @returns {number} relative luminance per WCAG 2.x
 */
export function luminance(hex) {
  const [r, g, b] = parseHex(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * @param {string} fg
 * @param {string} bg
 * @returns {number} contrast ratio, 1 to 21
 */
export function contrastRatio(fg, bg) {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Composites a translucent color over an opaque background.
 * @param {string} fg
 * @param {number} alpha 0-1
 * @param {string} bg
 * @returns {string} `#rrggbb`
 */
export function composite(fg, alpha, bg) {
  const f = parseHex(fg);
  const b = parseHex(bg);
  const mixed = f.map((v, i) => Math.round(v * alpha + b[i] * (1 - alpha)));
  return `#${mixed.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
