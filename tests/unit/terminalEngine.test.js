import { MESSAGES, createFilesystem } from "../../src/data/terminalContent.js";
import { TerminalEngine } from "../../src/lib/terminal/TerminalEngine.js";
import { buildFilesystem } from "../../src/lib/terminal/path.js";

const tools = [
  { slug: "alpha", name: "Alpha Tool" },
  { slug: "beta", name: "Beta Tool" },
];

function makeEngine() {
  return new TerminalEngine({
    filesystem: buildFilesystem(createFilesystem(new Date(2026, 5, 1)), tools),
    tools,
    toolUrl: (slug) => `https://tools.test/${slug}/`,
    portfolioUrl: "https://portfolio.test",
    messages: MESSAGES,
  });
}

const output = (result) => result.lines.filter((l) => l.type === "output").flatMap((l) => l.text);
const errors = (result) => result.lines.filter((l) => l.type === "error").flatMap((l) => l.text);

describe("TerminalEngine", () => {
  it("starts at the root with a prompt", () => {
    expect(makeEngine().prompt).toBe("faysal@desktop:~$");
  });

  it("echoes the input with the prompt, and only echoes a blank line", () => {
    const engine = makeEngine();
    expect(engine.execute("   ")).toEqual({ lines: [{ type: "input", text: ["faysal@desktop:~$    "] }], effects: [] });
    expect(engine.execute("help").lines[0]).toEqual({ type: "input", text: ["faysal@desktop:~$ help"] });
  });

  it("prints help, whoami and the sudo easter egg (with any arguments)", () => {
    const engine = makeEngine();
    expect(output(engine.execute("help"))).toEqual(MESSAGES.HELP_TEXT);
    expect(output(engine.execute("whoami"))).toEqual(MESSAGES.WHOAMI_TEXT);
    expect(output(engine.execute("sudo rm -rf /"))).toEqual(MESSAGES.SUDO_TEXT);
  });

  it("answers unknown commands, including names that exist on Object.prototype", () => {
    const engine = makeEngine();
    for (const name of ["frobnicate", "constructor", "toString", "__proto__"]) {
      expect(errors(engine.execute(name))).toEqual([MESSAGES.COMMAND_NOT_FOUND]);
    }
  });

  it("clear returns a clear effect and no lines, echo included", () => {
    expect(makeEngine().execute("clear")).toEqual({ lines: [], effects: [{ type: "clear" }] });
  });

  describe("navigation", () => {
    it("tracks the cwd through cd, nested paths, .. and the root forms", () => {
      const engine = makeEngine();
      engine.execute("cd tools/");
      expect(engine.prompt).toBe("faysal@desktop:~/tools$");
      engine.execute("cd ..");
      expect(engine.prompt).toBe("faysal@desktop:~$");
      engine.execute("cd .secrets");
      engine.execute("cd /");
      expect(engine.prompt).toBe("faysal@desktop:~$");
      engine.execute("cd tools");
      engine.execute("cd");
      expect(engine.prompt).toBe("faysal@desktop:~$");
    });

    it("reports bad cd targets and keeps the cwd", () => {
      const engine = makeEngine();
      expect(errors(engine.execute("cd nowhere"))).toEqual([MESSAGES.NO_SUCH_DIR("nowhere")]);
      expect(errors(engine.execute("cd about.txt"))).toEqual([MESSAGES.NOT_A_DIRECTORY("about.txt")]);
      expect(engine.prompt).toBe("faysal@desktop:~$");
    });

    it("keeps one engine per cwd: two engines do not share state", () => {
      const a = makeEngine();
      const b = makeEngine();
      a.execute("cd tools");
      expect(b.prompt).toBe("faysal@desktop:~$");
    });
  });

  describe("ls", () => {
    it("lists the root without dotfiles, and with them for -a and -la", () => {
      const engine = makeEngine();
      expect(output(engine.execute("ls"))).toEqual(["about.txt   contact.txt   tools/"]);
      expect(output(engine.execute("ls -a"))[0]).toContain(".secrets/");
      expect(output(engine.execute("ls -la"))[0]).toContain(".secrets/");
    });

    it("lists tools with a hint, from the root by path and from inside", () => {
      const engine = makeEngine();
      expect(output(engine.execute("ls tools"))).toEqual([
        "alpha",
        "beta",
        "[more coming]",
        "",
        "use 'open [name]' to launch one.",
      ]);
      engine.execute("cd tools");
      expect(output(engine.execute("ls"))).toContain("alpha");
    });

    it("handles a file, an empty result and a missing path", () => {
      const engine = makeEngine();
      expect(output(engine.execute("ls about.txt"))).toEqual(["about.txt"]);
      expect(errors(engine.execute("ls nowhere"))).toEqual([MESSAGES.LS_NOT_FOUND("nowhere")]);
      const empty = new TerminalEngine({
        filesystem: { type: "dir", children: {} },
        tools: [],
        toolUrl: () => "",
        portfolioUrl: "",
        messages: MESSAGES,
      });
      expect(output(empty.execute("ls"))).toEqual(["(empty)"]);
    });
  });

  describe("cat", () => {
    it("reads files by name and by path", () => {
      const engine = makeEngine();
      expect(output(engine.execute("cat about.txt"))[0]).toBe("22 years making Google behave. Currently VP-track:");
      expect(output(engine.execute("cat .secrets/resume-link.txt"))[0]).toContain("the paper trail lives at");
    });

    it("builds contact.txt from the profile", () => {
      expect(output(makeEngine().execute("cat contact.txt"))[0]).toBe("The direct line: contactfaysal@gmail.com");
    });

    it("reports missing files, directories, tools and a missing argument", () => {
      const engine = makeEngine();
      expect(errors(engine.execute("cat"))).toEqual(["cat: missing filename"]);
      expect(errors(engine.execute("cat nope"))).toEqual([MESSAGES.FILE_NOT_FOUND("nope")]);
      expect(errors(engine.execute("cat tools"))).toEqual([MESSAGES.IS_A_DIRECTORY("tools")]);
      expect(output(engine.execute("cat tools/alpha"))[0]).toContain("that's a tool, not a file");
    });
  });

  describe("open", () => {
    it("asks the host to open a tool with its url", () => {
      const result = makeEngine().execute("open alpha");
      expect(output(result)).toEqual(["opening alpha..."]);
      expect(result.effects).toEqual([
        { type: "open-tool", slug: "alpha", name: "Alpha Tool", url: "https://tools.test/alpha/" },
      ]);
    });

    it("opens the portfolio for resume and portfolio", () => {
      for (const word of ["resume", "portfolio"]) {
        const result = makeEngine().execute(`open ${word}`);
        expect(result.effects).toEqual([{ type: "open-url", url: "https://portfolio.test" }]);
      }
    });

    it("explains a missing argument and an unknown tool, with no effects", () => {
      const engine = makeEngine();
      const none = engine.execute("open");
      expect(errors(none)[0]).toContain("open: what, though?");
      expect(none.effects).toEqual([]);
      const unknown = engine.execute("open gamma");
      expect(errors(unknown)).toEqual(["open: gamma: no such tool or app. try 'ls tools' or 'help'."]);
      expect(unknown.effects).toEqual([]);
    });
  });
});
