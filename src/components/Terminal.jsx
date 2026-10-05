import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/terminal.css";
import { BOOT_LINE, MESSAGES, createFilesystem } from "../data/terminalContent.js";
import { OPENABLE_APPS } from "../data/apps.js";
import { PROFILE } from "../data/profile.js";
import { tools, toolUrl } from "../data/tools.js";
import { CommandHistory } from "../lib/terminal/history.js";
import { TerminalEngine } from "../lib/terminal/TerminalEngine.js";
import { buildFilesystem } from "../lib/terminal/path.js";

/** @typedef {import("../lib/terminal/TerminalEngine.js").TerminalLine & { id: number }} ScreenLine */

/** @type {ScreenLine[]} */
const BOOT_LINES = [{ id: 0, type: "boot", text: [BOOT_LINE] }];

/**
 * Renders the terminal. Parsing and state live in `TerminalEngine`; this component prints its
 * lines and carries out its effects. Changed from the original: `onOpenApp` (for `open files`
 * and friends), error lines, and Ctrl+L to clear.
 * @param {{
 *   onOpenTool: (slug: string, name: string, url: string) => void,
 *   onOpenApp: (id: string) => void,
 * }} props
 */
export default function Terminal({ onOpenTool, onOpenApp }) {
  const engine = useMemo(
    () =>
      new TerminalEngine({
        filesystem: buildFilesystem(createFilesystem(), tools),
        tools,
        apps: OPENABLE_APPS,
        toolUrl,
        portfolioUrl: PROFILE.portfolio.url,
        messages: MESSAGES,
      }),
    [],
  );
  const history = useRef(new CommandHistory());
  const nextLineId = useRef(1);
  const [lines, setLines] = useState(BOOT_LINES);
  const [input, setInput] = useState("");
  const [prompt, setPrompt] = useState(engine.prompt);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines]);

  // The terminal is opened to be typed in, so its input takes focus when it mounts.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const runEffects = (effects) => {
    for (const effect of effects) {
      if (effect.type === "open-url") window.open(effect.url, "_blank", "noopener");
      if (effect.type === "open-tool") onOpenTool(effect.slug, effect.name, effect.url);
      if (effect.type === "open-app") onOpenApp(effect.id);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    history.current.push(input);
    const { lines: printed, effects } = engine.execute(input);
    const clear = effects.some((effect) => effect.type === "clear");
    const stamped = printed.map((line) => ({ ...line, id: nextLineId.current++ }));
    setLines((prev) => (clear ? [] : [...prev, ...stamped]));
    setPrompt(engine.prompt);
    setInput("");
    runEffects(effects);
  };

  const onKeyDown = (e) => {
    if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
      return;
    }
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const recalled = e.key === "ArrowUp" ? history.current.previous() : history.current.next();
    if (recalled !== null) setInput(recalled);
  };

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- clicking anywhere in the terminal focuses its input; the input itself is the keyboard target
    <div className="terminal" onClick={() => inputRef.current?.focus()}>
      <div ref={scrollRef} className="terminal__output" role="log" aria-live="polite" aria-label="Terminal output">
        {lines.map((line) => (
          <div key={line.id} className={`terminal__line terminal__line--${line.type}`}>
            {line.text.map((t, j) => (
              // eslint-disable-next-line react/no-array-index-key -- the lines of one output block never reorder
              <div key={j}>{t === "" ? " " : t}</div>
            ))}
          </div>
        ))}
      </div>
      <form className="terminal__form" onSubmit={onSubmit}>
        <span className="terminal__prompt">{prompt}</span>
        <input
          ref={inputRef}
          className="terminal__input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoComplete="off"
          aria-label="Terminal command input"
        />
      </form>
    </div>
  );
}
