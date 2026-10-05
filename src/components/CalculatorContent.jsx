import { useCallback, useState } from "react";
import "../styles/calculator.css";
import { CALC_KEYS, keyFromEvent, pressKey } from "../lib/calculator.js";

/** Calculator window body. Mouse, touch and keyboard (digits, operators, Enter, Backspace, Delete). */
export default function CalculatorContent() {
  const [expr, setExpr] = useState("0");
  const press = useCallback((key) => setExpr((current) => pressKey(current, key)), []);

  const onKeyDown = (e) => {
    // Enter on a focused key button already clicks it; do not press "=" twice.
    if (e.key === "Enter" && e.target.closest("button")) return;
    const key = keyFromEvent(e.key);
    if (!key) return;
    e.preventDefault();
    press(key);
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- keyboard input for the whole calculator; every key is also a real button
    <div className="calc" role="group" aria-label="Calculator" onKeyDown={onKeyDown}>
      <output className="calc__display" aria-live="polite">
        {expr}
      </output>
      <div className="calc__keys">
        {CALC_KEYS.map((key) => (
          <button key={key.label} className={`calc__key calc__key--${key.kind}`} onClick={() => press(key.label)}>
            {key.label}
          </button>
        ))}
      </div>
    </div>
  );
}
