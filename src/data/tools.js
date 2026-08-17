// Mirrors the locked slugs in fa-portfolio/src/data/tools.js (phase-4-tool-slugs.md).
// Two separate repos/domains, so this list is duplicated rather than shared — keep
// in sync by hand if a slug changes. Canonical hosting is always portfolio.faysalahmed.ca.
export const PORTFOLIO_ORIGIN = "https://portfolio.faysalahmed.ca";

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
