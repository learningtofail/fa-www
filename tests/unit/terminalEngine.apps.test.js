import { describe, expect, it } from "vitest";
import { TerminalEngine } from "../../src/lib/terminal/TerminalEngine.js";

const messages = {
  HELP_TEXT: ["help"],
  WHOAMI_TEXT: ["me"],
  SUDO_TEXT: ["no"],
  COMMAND_NOT_FOUND: "not found",
  FILE_NOT_FOUND: (n) => `no file ${n}`,
  IS_A_DIRECTORY: (n) => `dir ${n}`,
  NO_SUCH_DIR: (n) => `no dir ${n}`,
  NOT_A_DIRECTORY: (n) => `not dir ${n}`,
  LS_NOT_FOUND: (n) => `no entry ${n}`,
};
const make = (extra = {}) =>
  new TerminalEngine({
    filesystem: { type: "dir", children: { "a.txt": { type: "file", content: ["hello"] } } },
    tools: [{ slug: "tool-one", name: "Tool One" }],
    toolUrl: (slug) => `/tools/${slug}/`,
    portfolioUrl: "/portfolio",
    messages,
    ...extra,
  });

describe("TerminalEngine: errors and apps", () => {
  it("prints failures as error lines and successes as output lines", () => {
    const engine = make();
    expect(engine.execute("nope").lines[1].type).toBe("error");
    expect(engine.execute("cat missing").lines[1].type).toBe("error");
    expect(engine.execute("cd missing").lines[1].type).toBe("error");
    expect(engine.execute("ls missing").lines[1].type).toBe("error");
    expect(engine.execute("cat").lines[1].type).toBe("error");
    expect(engine.execute("open").lines[1].type).toBe("error");
    expect(engine.execute("cat a.txt").lines[1].type).toBe("output");
    expect(engine.execute("help").lines[1].type).toBe("output");
  });

  it("launches an app with an open-app effect", () => {
    const engine = make({ apps: [{ slug: "files", name: "Files" }] });
    const result = engine.execute("open files");
    expect(result.effects).toEqual([{ type: "open-app", id: "files", name: "Files" }]);
    expect(result.lines[1]).toEqual({ type: "output", text: ["opening files..."] });
  });

  it("still launches tools, and rejects unknown names with an error line", () => {
    const engine = make({ apps: [{ slug: "files", name: "Files" }] });
    expect(engine.execute("open tool-one").effects[0]).toMatchObject({ type: "open-tool", slug: "tool-one" });
    const unknown = engine.execute("open nothing");
    expect(unknown.effects).toEqual([]);
    expect(unknown.lines[1].type).toBe("error");
  });

  it("works without an apps dependency", () => {
    expect(make().execute("open files").effects).toEqual([]);
  });
});
