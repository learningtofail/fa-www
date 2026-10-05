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
  it("holds 21 tools in six groups, with unique slugs, names, labels and glyph per group", () => {
    expect(MARKETING_TOOLS).toHaveLength(21);
    expect(MARKETING_GROUPS).toHaveLength(6);
    for (const key of ["slug", "name", "label"]) {
      expect(new Set(MARKETING_TOOLS.map((t) => t[key])).size).toBe(21);
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
    expect(MARKETING_TOOLS.every((t) => t.url === marketingUrl(t.slug))).toBe(true);
  });

  it("does not reuse a slug from the five portfolio tools", () => {
    for (const slug of ["utm-auditor", "gtm-auditor", "cac-calculator", "attribution", "disclosure-check"]) {
      expect(isMarketingTool(slug)).toBe(false);
    }
  });

  it("looks up an icon by slug and returns nothing for an unknown one", () => {
    expect(marketingIcon("scv-gap-calculator")).toEqual({ glyph: "\u{1F464}", tone: "mkt-governance" });
    expect(marketingIcon("nope")).toBeUndefined();
    expect(isMarketingTool("nope")).toBe(false);
  });

  it("has a folder registry for Tools and Marketing", () => {
    expect(Object.keys(FOLDERS)).toEqual(["tools", "marketing"]);
    expect(isFolder("marketing")).toBe(true);
    expect(isFolder("constructor")).toBe(false);
    expect(FOLDERS.tools.groups[0].items).toHaveLength(5);
    expect(FOLDERS.marketing.groups.flatMap((g) => g.items)).toHaveLength(21);
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
