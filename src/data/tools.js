// Tool frame constants. The catalog of tools lives in marketingTools.js (it mirrors fa-portfolio by hand).

/** Icon shared by every tool tile and dock button; `tone` names an `--app-tone-*` token. */
export const TOOL_ICON = Object.freeze({ glyph: "\u{1F527}", tone: "tool" });

/**
 * Attributes for the tool frame (see docs/decisions once Phase 7 lands, and the e2e stub test).
 *
 * - allow-scripts: the tools are React islands.
 * - allow-same-origin: without it the frame gets an opaque origin, and its module scripts are
 *   fetched cross-origin with `Origin: null`, which fails unless the host sends CORS headers.
 *   This keeps the tool on its own origin (portfolio), not on www's, so it does not expose www.
 * - allow-downloads: the tools export CSV and other files.
 * Not granted: top navigation, popups, modals, forms, pointer lock, presentation.
 */
export const TOOL_FRAME = Object.freeze({
  sandbox: "allow-scripts allow-same-origin allow-downloads",
  referrerPolicy: "strict-origin",
  loadTimeoutMs: 10_000,
});

/**
 * Frame for the marketing tools. Same as TOOL_FRAME plus `allow-modals`, which "Print or save PDF" needs
 * (a sandboxed frame cannot call window.print without it), and clipboard write for their copy buttons.
 * The pages are on the portfolio origin under their own CSP (connect-src 'none'), so neither grant can
 * send data anywhere. See docs/decisions/0010-marketing-apps.md.
 */
export const MARKETING_FRAME = Object.freeze({
  ...TOOL_FRAME,
  sandbox: `${TOOL_FRAME.sandbox} allow-modals`,
  allow: "clipboard-write",
});
