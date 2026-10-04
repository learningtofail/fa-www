import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { composite, contrastRatio, luminance } from "./support/contrast.js";

/**
 * Reads `--name: value;` declarations from the token files in cascade order
 * (vendored layer first, site layer second, so site overrides win).
 * @param {string[]} files
 * @returns {Map<string, string>}
 */
function loadTokens(files) {
  const tokens = new Map();
  for (const file of files) {
    const css = readFileSync(resolve(process.cwd(), "src/styles", file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const [, name, value] of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) tokens.set(name, value.trim());
  }
  return tokens;
}

const tokens = loadTokens(["tokens.css", "site.tokens.css"]);

/** Resolves `var(--x)` aliases down to a hex value. */
function color(name) {
  let value = tokens.get(name);
  for (let hops = 0; value?.startsWith("var("); hops++) {
    if (hops > 10) throw new Error(`alias loop at ${name}`);
    value = tokens.get(value.slice(4, -1).trim());
  }
  if (!value || !value.startsWith("#")) throw new Error(`${name} does not resolve to a hex color (${value})`);
  return value;
}

const WHITE = color("--win-bg");
const ENTRY_REST = composite("#000000", 0.05, WHITE); // --content-entry-fill: rgba(0,0,0,0.05)
const ENTRY_HOVER = composite("#000000", 0.08, WHITE); // --content-entry-fill-hover: rgba(0,0,0,0.08)

const AA_TEXT = 4.5;

/** Every text/background pair that renders inside a light window body, plus the terminal. */
const PAIRS = [
  ["link on window body", color("--link"), WHITE],
  ["visited link on window body", color("--link-visited"), WHITE],
  ["body text", color("--content-text"), WHITE],
  ["muted text and form labels", color("--content-text-muted"), WHITE],
  ["success text", color("--content-success"), WHITE],
  ["error text", color("--content-error"), WHITE],
  ["placeholder on entry fill", color("--placeholder-text"), ENTRY_REST],
  ["placeholder on hovered entry fill", color("--placeholder-text"), ENTRY_HOVER],
  ["entry text on entry fill", color("--content-text"), ENTRY_REST],
  ["entry text on hovered entry fill", color("--content-text"), ENTRY_HOVER],
  ["primary button text", color("--primary-text"), color("--primary")],
  ["primary button text, hover", color("--primary-text"), color("--primary-hover")],
  ["primary button text, active", color("--primary-text"), color("--primary-active")],
  ["terminal text", color("--term-fg"), color("--term-bg")],
  ["terminal accent", color("--term-accent"), color("--term-bg")],
  ["terminal dim text", color("--term-dim"), color("--term-bg")],
];

describe("contrast helpers", () => {
  it("matches the WCAG reference values", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBe(1);
    expect(luminance("#fff")).toBeCloseTo(1, 5);
  });

  it("composites alpha over a background", () => {
    expect(composite("#000000", 0.05, "#ffffff")).toBe("#f2f2f2");
  });
});

describe("D5: text contrast meets WCAG AA (4.5:1)", () => {
  it.each(PAIRS)("%s", (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it("uses the reviewed override values", () => {
    expect(color("--primary")).toBe("#1558b0");
    expect(color("--link")).toBe("#1558b0");
    expect(color("--link-visited")).toBe("#7b1fa2");
    expect(color("--content-success")).toBe("#216e3b");
  });
});
