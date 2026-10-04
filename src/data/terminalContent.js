// Sourced from the approved Phase 2 www copy (claude/phase-2-www-copy.md in the
// project docs). Keep flavor text edits here, not scattered through Terminal.jsx.

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
/** @type {import("../lib/terminal/path.js").FsNode} */
export const FILESYSTEM = {
  type: "dir",
  children: {
    "about.txt": {
      type: "file",
      content: [
        "22 years making Google behave. Currently VP-track:",
        "SEO, organic growth, the occasional turnaround.",
        "",
        "Real background lives at portfolio.faysalahmed.ca —",
        "this is the version of the site that doesn't take",
        "itself as seriously.",
      ],
    },
    "contact.txt": {
      type: "file",
      content: [
        "The direct line: contactfaysal@gmail.com",
        "The professional line: linkedin.com/in/faysalahmed",
        "",
        "(there's a Contact window on the desktop with an actual form)",
      ],
    },
    tools: {
      type: "dir",
      children: {}, // populated from data/tools.js by buildFilesystem
    },
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
          content: ["the paper trail lives at portfolio.faysalahmed.ca", "run 'open resume' to go there directly."],
        },
      },
    },
  },
};
