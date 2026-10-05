import { APPS, DESKTOP_ICON_APPS } from "../../src/data/apps.js";
import { tools, toolUrl, PORTFOLIO_ORIGIN, TOOL_FRAME } from "../../src/data/tools.js";
import { CAREER_START_YEAR, PROFILE, summary, tagline, yearsActive } from "../../src/data/profile.js";
import { createFilesystem, HELP_TEXT } from "../../src/data/terminalContent.js";

describe("app registry", () => {
  it("lists the eleven apps both shells render", () => {
    expect(APPS.map((a) => a.id)).toEqual([
      "about",
      "contact",
      "now",
      "files",
      "editor",
      "calculator",
      "weather",
      "viewer",
      "tools",
      "marketing",
      "terminal",
    ]);
  });

  it("keeps the terminal and the dock-only apps off the desktop icon grid", () => {
    expect(DESKTOP_ICON_APPS.map((a) => a.id)).toEqual(["about", "contact", "now", "tools", "marketing"]);
  });

  it("gives every app a kind that a shell knows how to render", () => {
    for (const app of APPS) expect(["window", "folder", "terminal"]).toContain(app.kind);
  });
});

describe("tools catalog", () => {
  it("holds the five locked slugs", () => {
    expect(tools.map((t) => t.slug)).toEqual([
      "utm-auditor",
      "gtm-auditor",
      "cac-calculator",
      "attribution",
      "disclosure-check",
    ]);
  });

  it("builds tool URLs on the portfolio origin with a trailing slash", () => {
    expect(toolUrl("utm-auditor")).toBe(`${PORTFOLIO_ORIGIN}/tools/utm-auditor/`);
  });
});

describe("terminal content", () => {
  it("exposes the virtual filesystem the README documents", () => {
    const root = /** @type {{ children: Record<string, any> }} */ (createFilesystem());
    expect(Object.keys(root.children).sort()).toEqual([".secrets", "about.txt", "contact.txt", "tools"]);
    expect(Object.keys(root.children[".secrets"].children).sort()).toEqual([
      "resume-link.txt",
      "well-hidden-for-a-reason.txt",
    ]);
  });

  it("documents every implemented command except the hidden one", () => {
    const help = HELP_TEXT.join("\n");
    for (const cmd of ["help", "ls", "cd", "cat", "open", "whoami", "clear"]) expect(help).toContain(cmd);
    expect(help).not.toContain("sudo");
  });
});

describe("tool frame", () => {
  it("grants scripts, same-origin and downloads, and nothing that lets the tool navigate or pop up", () => {
    const flags = TOOL_FRAME.sandbox.split(" ").sort();
    expect(flags).toEqual(["allow-downloads", "allow-same-origin", "allow-scripts"]);
  });
});

describe("profile", () => {
  it("computes the years figure from the career start year", () => {
    expect(CAREER_START_YEAR).toBe(2004);
    expect(yearsActive(new Date(2026, 9, 4))).toBe(22);
    expect(yearsActive(new Date(2027, 0, 2))).toBe(23);
    expect(tagline(new Date(2027, 0, 2))).toBe("23 years making Google behave.");
  });

  it("composes the summary used by About and about.txt", () => {
    expect(summary(new Date(2026, 9, 4))).toBe(
      "22 years making Google behave. Currently VP-track: SEO, organic growth, the occasional turnaround.",
    );
  });

  it("holds no phone number or street address (those stay out of this repo)", () => {
    expect(JSON.stringify(PROFILE)).not.toMatch(/\+?\d[\d\s().-]{8,}\d/);
  });
});
