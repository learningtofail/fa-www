import { createHash } from "node:crypto";

/**
 * Pure helpers behind `npm run tokens:check` and `npm run tokens:sync`.
 * The vendored token file is generated from files of the Orchis DS repo at a pinned commit,
 * so it can be rebuilt and compared byte for byte.
 */

/**
 * @typedef {{ source: string, sha: string, files: string[], output: string, sha256: string }} OrchisManifest
 */

/**
 * @param {string} text
 * @returns {string} lowercase hex SHA-256
 */
export function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

/**
 * Raw URL of one DS file at the pinned commit.
 * @param {OrchisManifest} manifest
 * @param {string} path
 * @returns {string}
 */
export function rawUrl(manifest, path) {
  return `https://raw.githubusercontent.com/${manifest.source}/${manifest.sha}/${path}`;
}

/**
 * Builds the vendored file from the DS sources. The only transform is dropping `@import` lines:
 * fa-www self-hosts its fonts through @fontsource packages instead of the DS Google Fonts import.
 * @param {OrchisManifest} manifest
 * @param {{ path: string, text: string }[]} sources in manifest order
 * @returns {string}
 */
export function buildVendoredCss(manifest, sources) {
  const header = [
    "/* GENERATED FILE. Do not edit. Run `npm run tokens:sync` to rebuild it.",
    `   Source: github.com/${manifest.source} at commit ${manifest.sha}`,
    `   Files: ${manifest.files.join(", ")}`,
    "   Transform: `@import` lines are removed (fonts come from @fontsource packages).",
    "   `npm run tokens:check` rebuilds this file from the pinned commit and fails on any difference.",
    "   Site decisions and overrides live in site.tokens.css, which loads after this file. */",
  ].join("\n");
  const bodies = sources.map(({ path, text }) => {
    const body = text.replace(/^@import\b[^\n]*\n?/gm, "").trim();
    return `/* ---- ${path} ---- */\n${body}`;
  });
  return `${header}\n\n${bodies.join("\n\n")}\n`;
}
