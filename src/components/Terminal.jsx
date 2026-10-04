import { useState, useRef, useEffect, useCallback } from "react";
import "../styles/terminal.css";
import { BOOT_LINE, HELP_TEXT, WHOAMI_TEXT, SUDO_TEXT, COMMAND_NOT_FOUND, FILE_NOT_FOUND, IS_A_DIRECTORY, NO_SUCH_DIR, FILESYSTEM } from "../data/terminalContent.js";
import { tools, toolUrl } from "../data/tools.js";

function pathLabel(pathArr) {
  return pathArr.length === 0 ? "~" : `~/${pathArr.join("/")}`;
}

function resolveDir(pathArr) {
  let node = FILESYSTEM;
  for (const seg of pathArr) {
    node = node.children[seg];
    if (!node || node.type !== "dir") return null;
  }
  return node;
}

function dirEntries(pathArr) {
  const node = resolveDir(pathArr);
  if (!node) return [];
  if (pathArr[pathArr.length - 1] === "tools") {
    return [...tools.map((t) => t.slug), "[more coming]"];
  }
  return Object.entries(node.children).map(([name, child]) => (child.type === "dir" ? `${name}/` : name));
}

export default function Terminal({ onOpenTool }) {
  const [lines, setLines] = useState([{ type: "boot", text: [BOOT_LINE] }]);
  const [input, setInput] = useState("");
  const [cwd, setCwd] = useState([]); // path segments, [] = root
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines]);

  const print = useCallback((text) => {
    setLines((prev) => [...prev, { type: "output", text: Array.isArray(text) ? text : [text] }]);
  }, []);

  const runCommand = useCallback(
    (raw) => {
      const trimmed = raw.trim();
      setLines((prev) => [...prev, { type: "input", text: [`faysal@desktop:${pathLabel(cwd)}$ ${raw}`] }]);
      if (!trimmed) return;

      const [cmd, ...args] = trimmed.split(/\s+/);
      const arg = args.join(" ");

      if (cmd === "sudo") {
        print(SUDO_TEXT);
        return;
      }

      switch (cmd) {
        case "help":
          print(HELP_TEXT);
          return;

        case "whoami":
          print(WHOAMI_TEXT);
          return;

        case "clear":
          setLines([]);
          return;

        case "ls": {
          const entries = dirEntries(cwd);
          if (cwd[cwd.length - 1] === "tools") {
            print([...entries, "", "use 'open [name]' to launch one."]);
          } else {
            print(entries.length ? entries.join("   ") : "(empty)");
          }
          return;
        }

        case "cd": {
          if (!arg || arg === "~" || arg === "/") {
            setCwd([]);
            return;
          }
          if (arg === "..") {
            setCwd((prev) => prev.slice(0, -1));
            return;
          }
          const currentNode = resolveDir(cwd);
          const target = currentNode?.children?.[arg];
          if (target && target.type === "dir") {
            setCwd((prev) => [...prev, arg]);
          } else {
            print(NO_SUCH_DIR(arg));
          }
          return;
        }

        case "cat": {
          if (!arg) {
            print("cat: missing filename");
            return;
          }
          if (cwd[cwd.length - 1] === "tools") {
            const match = tools.find((t) => t.slug === arg);
            if (match) {
              print(`that's a tool, not a file. run 'open ${arg}' to launch it.`);
              return;
            }
          }
          const currentNode = resolveDir(cwd);
          const target = currentNode?.children?.[arg];
          if (!target) {
            print(FILE_NOT_FOUND(arg));
          } else if (target.type === "dir") {
            print(IS_A_DIRECTORY(arg));
          } else {
            print(target.content);
          }
          return;
        }

        case "open": {
          if (!arg) {
            print("open: what, though? try 'open [tool-slug]', 'open resume', or 'ls tools' first.");
            return;
          }
          if (arg === "resume" || arg === "portfolio") {
            print("redirecting to the paper trail...");
            window.open("https://portfolio.faysalahmed.ca", "_blank", "noopener");
            return;
          }
          const match = tools.find((t) => t.slug === arg);
          if (match) {
            print(`opening ${arg}...`);
            onOpenTool(match.slug, match.name, toolUrl(match.slug));
            return;
          }
          print(`open: ${arg}: no such tool. try 'ls tools' or 'help'.`);
          return;
        }

        default:
          print(COMMAND_NOT_FOUND);
      }
    },
    [cwd, print, onOpenTool]
  );

  const onSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setHistory((prev) => [...prev, input]);
    }
    setHistoryIdx(null);
    runCommand(input);
    setInput("");
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = historyIdx === null ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(nextIdx);
      setInput(history[nextIdx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx === null) return;
      const nextIdx = historyIdx + 1;
      if (nextIdx >= history.length) {
        setHistoryIdx(null);
        setInput("");
      } else {
        setHistoryIdx(nextIdx);
        setInput(history[nextIdx]);
      }
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- clicking anywhere in the terminal focuses its input; the input itself is the keyboard target
    <div
      onClick={() => inputRef.current?.focus()}
      style={{
        height: "100%",
        background: "var(--term-bg)",
        color: "var(--term-fg)",
        fontFamily: "var(--font-terminal)",
        fontSize: "var(--term-font-size)",
        display: "flex",
        flexDirection: "column",
        padding: "var(--space-2x)",
      }}
    >
      <div ref={scrollRef} role="log" aria-live="polite" aria-label="Terminal output" style={{ flex: 1, overflowY: "auto" }}>
        {lines.map((line, i) => (
          <div
            // eslint-disable-next-line react/no-array-index-key -- append-only output list; rewritten with stable ids in Phase 4
            key={i}
            style={{
              marginBottom: line.type === "input" ? 0 : "var(--space-half)",
              color:
                line.type === "input"
                  ? "var(--term-accent)"
                  : line.type === "boot"
                    ? "var(--term-dim)"
                    : "var(--term-fg)",
            }}
          >
            {line.text.map((t, j) => (
              // eslint-disable-next-line react/no-array-index-key -- lines of one output block never reorder
              <div key={j}>{t === "" ? " " : t}</div>
            ))}
          </div>
        ))}
      </div>
      <form onSubmit={onSubmit} style={{ display: "flex", alignItems: "center", marginTop: "var(--space-half)" }}>
        <span style={{ color: "var(--term-accent)", marginRight: "var(--space-size)" }}>
          faysal@desktop:{pathLabel(cwd)}$
        </span>
        <input
          ref={inputRef}
          className="term-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- terminal input takes focus when its window opens; replaced by useFocusReturn in Phase 4 (S11)
          autoFocus
          spellCheck={false}
          autoComplete="off"
          aria-label="Terminal command input"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            color: "var(--white)",
            fontFamily: "inherit",
            fontSize: "inherit",
          }}
        />
      </form>
    </div>
  );
}
