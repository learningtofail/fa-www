import { listEntries, parseLsArgs, pathLabel, resolvePath } from "./path.js";

/**
 * @typedef {{ type: "input" | "output" | "boot", text: string[] }} TerminalLine
 * @typedef {{ type: "clear" }
 *   | { type: "open-url", url: string }
 *   | { type: "open-tool", slug: string, name: string, url: string }} TerminalEffect
 * @typedef {{ lines: TerminalLine[], effects: TerminalEffect[] }} ExecuteResult
 * @typedef {{ lines?: string[], effects?: TerminalEffect[] }} CommandResult
 * @typedef {{
 *   HELP_TEXT: string[], WHOAMI_TEXT: string[], SUDO_TEXT: string[], COMMAND_NOT_FOUND: string,
 *   FILE_NOT_FOUND: (name: string) => string, IS_A_DIRECTORY: (name: string) => string,
 *   NO_SUCH_DIR: (name: string) => string, NOT_A_DIRECTORY: (name: string) => string,
 *   LS_NOT_FOUND: (name: string) => string,
 * }} Messages
 * @typedef {{
 *   filesystem: import("./path.js").FsNode,
 *   tools: { slug: string, name: string }[],
 *   toolUrl: (slug: string) => string,
 *   portfolioUrl: string,
 *   messages: Messages,
 * }} TerminalDeps
 */

/**
 * The terminal's command interpreter. It owns the current directory and a registry of
 * commands, and has no side effects: `execute` returns the lines to print plus a list of
 * effects (clear the screen, open a URL, open a tool) for the host component to carry out.
 */
export class TerminalEngine {
  /** @type {string[]} */
  #cwd = [];
  /** @type {Map<string, (args: string[], raw: string) => CommandResult>} */
  #commands = new Map();
  #deps;

  /** @param {TerminalDeps} deps everything the engine needs, injected so tests can supply fakes */
  constructor(deps) {
    this.#deps = deps;
    this.#commands
      .set("help", () => ({ lines: deps.messages.HELP_TEXT }))
      .set("whoami", () => ({ lines: deps.messages.WHOAMI_TEXT }))
      .set("sudo", () => ({ lines: deps.messages.SUDO_TEXT }))
      .set("clear", () => ({ effects: [{ type: "clear" }] }))
      .set("ls", (args) => this.#ls(args))
      .set("cd", (args) => this.#cd(args))
      .set("cat", (args) => this.#cat(args))
      .set("open", (args) => this.#open(args));
  }

  /** @returns {string} the prompt text, for example `faysal@desktop:~/tools$` */
  get prompt() {
    return `faysal@desktop:${pathLabel(this.#cwd)}$`;
  }

  /**
   * Runs one command line.
   * @param {string} raw exactly what the user typed
   * @returns {ExecuteResult}
   */
  execute(raw) {
    /** @type {TerminalLine} */
    const echo = { type: "input", text: [`${this.prompt} ${raw}`] };
    const trimmed = raw.trim();
    if (!trimmed) return { lines: [echo], effects: [] };

    const [name, ...args] = trimmed.split(/\s+/);
    const handler = this.#commands.get(name);
    const result = handler ? handler(args, raw) : { lines: [this.#deps.messages.COMMAND_NOT_FOUND] };
    const effects = result.effects ?? [];
    // `clear` wipes the screen, so its own echo line goes too.
    if (effects.some((effect) => effect.type === "clear")) return { lines: [], effects };
    const output = result.lines ? [{ type: /** @type {const} */ ("output"), text: result.lines }] : [];
    return { lines: [echo, ...output], effects };
  }

  /** @param {string[]} args @returns {CommandResult} */
  #ls(args) {
    const { showAll, operands } = parseLsArgs(args);
    const target = resolvePath(this.#deps.filesystem, this.#cwd, operands[0] ?? ".");
    if (!target) return { lines: [this.#deps.messages.LS_NOT_FOUND(operands[0])] };
    if (target.node.type !== "dir") return { lines: [target.segments[target.segments.length - 1]] };
    if (target.segments[target.segments.length - 1] === "tools") {
      return { lines: [...Object.keys(target.node.children), "[more coming]", "", "use 'open [name]' to launch one."] };
    }
    const entries = listEntries(target.node, showAll);
    return { lines: [entries.length ? entries.join("   ") : "(empty)"] };
  }

  /** @param {string[]} args @returns {CommandResult} */
  #cd(args) {
    const arg = args.join(" ");
    if (!arg) {
      this.#cwd = [];
      return {};
    }
    const target = resolvePath(this.#deps.filesystem, this.#cwd, arg);
    if (!target) return { lines: [this.#deps.messages.NO_SUCH_DIR(arg)] };
    if (target.node.type !== "dir") return { lines: [this.#deps.messages.NOT_A_DIRECTORY(arg)] };
    this.#cwd = target.segments;
    return {};
  }

  /** @param {string[]} args @returns {CommandResult} */
  #cat(args) {
    const arg = args.join(" ");
    if (!arg) return { lines: ["cat: missing filename"] };
    const { messages } = this.#deps;
    const target = resolvePath(this.#deps.filesystem, this.#cwd, arg);
    if (!target) return { lines: [messages.FILE_NOT_FOUND(arg)] };
    if (target.node.type === "tool") {
      return { lines: [`that's a tool, not a file. run 'open ${target.node.slug}' to launch it.`] };
    }
    if (target.node.type === "dir") return { lines: [messages.IS_A_DIRECTORY(arg)] };
    return { lines: target.node.content };
  }

  /** @param {string[]} args @returns {CommandResult} */
  #open(args) {
    const arg = args.join(" ");
    if (!arg) return { lines: ["open: what, though? try 'open [tool-slug]', 'open resume', or 'ls tools' first."] };
    if (arg === "resume" || arg === "portfolio") {
      return {
        lines: ["redirecting to the paper trail..."],
        effects: [{ type: "open-url", url: this.#deps.portfolioUrl }],
      };
    }
    const tool = this.#deps.tools.find((t) => t.slug === arg);
    if (!tool) return { lines: [`open: ${arg}: no such tool. try 'ls tools' or 'help'.`] };
    return {
      lines: [`opening ${arg}...`],
      effects: [{ type: "open-tool", slug: tool.slug, name: tool.name, url: this.#deps.toolUrl(tool.slug) }],
    };
  }
}
