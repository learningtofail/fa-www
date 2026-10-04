import { APPS, DESKTOP_ICON_APPS } from "../../src/data/apps.js";
import { tools, toolUrl, PORTFOLIO_ORIGIN } from "../../src/data/tools.js";
import { FILESYSTEM, HELP_TEXT } from "../../src/data/terminalContent.js";

describe("app registry", () => {
  it("lists the five apps both shells render", () => {
    expect(APPS.map((a) => a.id)).toEqual(["about", "contact", "now", "tools", "terminal"]);
  });

  it("keeps the terminal off the desktop icon grid", () => {
    expect(DESKTOP_ICON_APPS.map((a) => a.id)).toEqual(["about", "contact", "now", "tools"]);
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
    expect(Object.keys(FILESYSTEM.children).sort()).toEqual([".secrets", "about.txt", "contact.txt", "tools"]);
    expect(Object.keys(FILESYSTEM.children[".secrets"].children).sort()).toEqual([
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
