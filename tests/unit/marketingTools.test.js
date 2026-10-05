import { FOLDERS, isFolder } from "../../src/data/folders.js";
import {
  MARKETING_GROUPS,
  MARKETING_TOOLS,
  isMarketingTool,
  marketingIcon,
  marketingUrl,
} from "../../src/data/marketingTools.js";
import { MARKETING_FRAME, TOOL_FRAME } from "../../src/data/tools.js";

describe("marketing catalog", () => {
  it("holds 23 tools in six groups, with unique slugs, names, labels and glyph per group", () => {
    expect(MARKETING_TOOLS).toHaveLength(23);
    expect(MARKETING_GROUPS).toHaveLength(6);
    for (const key of ["slug", "name", "label"]) {
      expect(new Set(MARKETING_TOOLS.map((t) => t[key])).size).toBe(23);
    }
    for (const tool of MARKETING_TOOLS) {
      expect(tool.slug).toMatch(/^[a-z0-9-]+$/);
      expect(tool.glyph).toBeTruthy();
      expect(tool.label.length).toBeLessThanOrEqual(22);
    }
    for (const group of MARKETING_GROUPS) {
      expect(new Set(group.tools.map((t) => t.glyph)).size).toBe(group.tools.length);
    }
  });

  it("builds page URLs on the tools origin under /marketing/", () => {
    expect(marketingUrl("redirect-mapper")).toBe("https://portfolio.faysalahmed.ca/marketing/redirect-mapper.html");
    expect(MARKETING_TOOLS.filter((t) => !t.path).every((t) => t.url === marketingUrl(t.slug))).toBe(true);
    expect(MARKETING_TOOLS.filter((t) => !t.path)).toHaveLength(21);
  });

  it("treats the two Astro tools as tools but not as marketing pages", () => {
    for (const slug of ["attribution", "disclosure-check"]) {
      expect(isMarketingTool(slug)).toBe(false);
      expect(MARKETING_TOOLS.find((t) => t.slug === slug)?.url).toBe(`https://portfolio.faysalahmed.ca/tools/${slug}/`);
    }
    for (const slug of ["utm-auditor", "gtm-auditor", "cac-calculator"]) {
      expect(MARKETING_TOOLS.some((t) => t.slug === slug)).toBe(false);
    }
  });

  it("looks up an icon by slug and returns nothing for an unknown one", () => {
    expect(marketingIcon("scv-gap-calculator")).toEqual({ glyph: "\u{1F464}", tone: "mkt-governance" });
    expect(marketingIcon("nope")).toBeUndefined();
    expect(isMarketingTool("nope")).toBe(false);
  });

  it("has one folder, Marketing", () => {
    expect(Object.keys(FOLDERS)).toEqual(["marketing"]);
    expect(isFolder("marketing")).toBe(true);
    expect(isFolder("constructor")).toBe(false);
    expect(FOLDERS.marketing.groups.flatMap((g) => g.items)).toHaveLength(23);
  });
});

describe("marketing frame", () => {
  it("is the tool frame plus modals and clipboard write, and never drops same-origin", () => {
    expect(MARKETING_FRAME.sandbox.split(" ").sort()).toEqual(
      [...TOOL_FRAME.sandbox.split(" "), "allow-modals"].sort(),
    );
    expect(MARKETING_FRAME.sandbox).toContain("allow-same-origin");
    expect(MARKETING_FRAME.sandbox).not.toMatch(/allow-(top-navigation|popups|forms)/);
    expect(MARKETING_FRAME.allow).toBe("clipboard-write");
    expect(TOOL_FRAME.sandbox).not.toContain("allow-modals");
  });
});
