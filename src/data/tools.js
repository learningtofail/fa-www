import { config } from "../lib/config.js";

// Mirrors the locked slugs in fa-portfolio/src/data/tools.js (phase-4-tool-slugs.md).
// Two separate repos/domains, so this list is duplicated rather than shared — keep
// in sync by hand if a slug changes. Canonical hosting is always portfolio.faysalahmed.ca.
// The origin is configurable (PUBLIC_TOOLS_ORIGIN, see lib/config.js) and defaults to the production one.
export const PORTFOLIO_ORIGIN = config.toolsOrigin;

export const tools = [
  { slug: "utm-auditor", name: "UTM Governance Auditor" },
  { slug: "gtm-auditor", name: "GTM Container Auditor" },
  { slug: "cac-calculator", name: "CAC / Margin / Payback Calculator" },
  { slug: "attribution", name: "Multi-Touch Attribution" },
  { slug: "disclosure-check", name: "Disclosure Language Checker" },
];

export function toolUrl(slug) {
  return `${PORTFOLIO_ORIGIN}/tools/${slug}/`;
}

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
