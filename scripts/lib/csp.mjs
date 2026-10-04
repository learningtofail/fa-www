import { createHash } from "node:crypto";

/**
 * Finds the inline <script> and <style> bodies of a built page and returns their CSP hash sources.
 * Astro's island bootstrap is inline and identical between builds of the same Astro version, so a
 * hash-based Content-Security-Policy stays valid until Astro is upgraded.
 * @param {string} html
 * @returns {{ script: string[], style: string[] }} `'sha256-...'` sources, sorted, deduplicated
 */
export function inlineHashes(html) {
  /** @type {{ script: Set<string>, style: Set<string> }} */
  const found = { script: new Set(), style: new Set() };
  for (const match of html.matchAll(/<(script|style)\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
    const [, tag, attrs, body] = match;
    if (/\bsrc\s*=/.test(attrs) || body.trim() === "") continue;
    const digest = createHash("sha256").update(body).digest("base64");
    found[/** @type {"script" | "style"} */ (tag.toLowerCase())].add(`'sha256-${digest}'`);
  }
  return { script: [...found.script].sort(), style: [...found.style].sort() };
}
