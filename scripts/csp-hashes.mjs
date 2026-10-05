// Prints the CSP hash sources for the inline scripts and styles in dist/index.html.
// Run after `npm run build` whenever Astro is upgraded, then update docs/caddy/Caddyfile.proposed.md.
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { inlineHashes } from "./lib/csp.mjs";

const html = await readFile(resolve(import.meta.dirname, "../dist/index.html"), "utf8");
const { script, style } = inlineHashes(html);
process.stdout.write(`script-src: ${script.join(" ")}\nstyle-src: ${style.join(" ")}\n`);
