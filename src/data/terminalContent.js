// Terminal flavor text and the virtual filesystem. Keep copy edits here, not in the engine or
// the component. Bio and contact lines come from data/profile.js.
import { PORTFOLIO_BLURB, PROFILE, ROLE_DETAIL, ROLE_PREFIX, tagline } from "./profile.js";

export const BOOT_LINE = "type 'help' to get started.";

export const HELP_TEXT = [
  "available commands:",
  "  help            you're looking at it",
  "  ls              list what's here",
  "  cd [dir]        go somewhere",
  "  cat [file]      read something",
  "  open [thing]    open a tool, or leave",
  "  whoami          bold of you to ask",
  "  clear           clean slate",
  "",
  "some things aren't listed. that's the point.",
];

export const WHOAMI_TEXT = ["you're looking at faysal's desktop. or a very convincing impression of one."];

export const SUDO_TEXT = [
  "nice try. you have 0 privileges here.",
  "this incident will not be reported, because",
  "nobody's watching.",
];

export const COMMAND_NOT_FOUND = "command not found. this isn't that kind of terminal.";
export const FILE_NOT_FOUND = (name) => `cat: ${name}: no such file. (yet.)`;
export const IS_A_DIRECTORY = (name) => `cat: ${name}: is a directory`;
export const NO_SUCH_DIR = (name) => `cd: ${name}: no such directory`;
export const NOT_A_DIRECTORY = (name) => `cd: ${name}: not a directory`;
export const LS_NOT_FOUND = (name) => `ls: ${name}: no such file or directory`;

// Virtual filesystem. Each node is either { type: "file", content: string[] }
// or { type: "dir", children: {...} }. The "tools" directory is empty here and is
// filled with one { type: "tool" } node per slug by buildFilesystem in lib/terminal/path.js.
const WRAP_WIDTH = 50;

/**
 * Greedy word wrap for terminal text.
 * @param {string} text
 * @param {number} width
 * @returns {string[]}
 */
export function wrap(text, width) {
  /** @type {string[]} */
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line && line.length + 1 + word.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Every message the terminal engine can print, injected into it as one object. */
export const MESSAGES = Object.freeze({
  HELP_TEXT,
  WHOAMI_TEXT,
  SUDO_TEXT,
  COMMAND_NOT_FOUND,
  FILE_NOT_FOUND,
  IS_A_DIRECTORY,
  NO_SUCH_DIR,
  NOT_A_DIRECTORY,
  LS_NOT_FOUND,
});

/**
 * Builds the virtual filesystem. Each node is `{ type: "file", content: string[] }` or
 * `{ type: "dir", children }`. The `tools` directory is empty here and is filled with one
 * `{ type: "tool" }` node per slug by `buildFilesystem` in lib/terminal/path.js.
 * @param {Date} [now]
 * @returns {import("../lib/terminal/path.js").FsNode}
 */
export function createFilesystem(now = new Date()) {
  return {
    type: "dir",
    children: {
      "about.txt": {
        type: "file",
        content: [
          `${tagline(now)} ${ROLE_PREFIX}`,
          ROLE_DETAIL,
          "",
          ...wrap(`Real background lives at ${PROFILE.portfolio.label} \u2014 ${PORTFOLIO_BLURB}`, WRAP_WIDTH),
        ],
      },
      "contact.txt": {
        type: "file",
        content: [
          `The direct line: ${PROFILE.email}`,
          `The professional line: ${PROFILE.linkedin.label}`,
          "",
          "(there's a Contact window on the desktop with an actual form)",
        ],
      },
      tools: { type: "dir", children: {} },
      ".secrets": {
        type: "dir",
        children: {
          "well-hidden-for-a-reason.txt": {
            type: "file",
            content: [
              "you found the hidden directory. no prize, just",
              "the quiet satisfaction of having used 'ls -a'",
              "energy on a website. respect.",
            ],
          },
          "resume-link.txt": {
            type: "file",
            content: [`the paper trail lives at ${PROFILE.portfolio.label}`, "run 'open resume' to go there directly."],
          },
        },
      },
    },
  };
}
