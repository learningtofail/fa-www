import { useEffect, useRef, useState } from "react";
import "../styles/quick-settings.css";
import Icon from "./Icon.jsx";
import { INITIAL_VOLUME, QUICK_TOGGLES } from "../data/quickSettings.js";
import { useFocusReturn } from "../hooks/useFocusReturn.js";

/**
 * The Quick Settings popover: volume slider and toggle pills. Escape (anywhere) or a click outside closes it
 * and focus returns to the tray button.
 * @param {{
 *   id: string,
 *   variant?: "popover" | "sheet",
 *   theme: "light" | "dark",
 *   onThemeChange: (theme: "light" | "dark") => void,
 *   onClose: () => void,
 * }} props
 */
export default function QuickSettings({ id, variant = "popover", theme, onThemeChange, onClose }) {
  const panelRef = useRef(null);
  useFocusReturn(panelRef);
  const [on, setOn] = useState(() => Object.fromEntries(QUICK_TOGGLES.map((t) => [t.id, Boolean(t.initial)])));
  const [volume, setVolume] = useState(INITIAL_VOLUME);

  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const isPressed = (toggle) => (toggle.theme ? theme === "dark" : on[toggle.id]);
  const onToggle = (toggle) => {
    if (toggle.theme) onThemeChange(theme === "dark" ? "light" : "dark");
    else setOn((prev) => ({ ...prev, [toggle.id]: !prev[toggle.id] }));
  };

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- backdrop click dismisses; the keyboard path is Escape on the dialog */}
      <div className="qs-backdrop" onClick={onClose} />
      <div
        ref={panelRef}
        id={id}
        className={`qs${variant === "sheet" ? " qs--sheet" : ""}`}
        role="dialog"
        aria-label="Quick settings"
        tabIndex={-1}
      >
        <label className="qs__volume">
          <Icon name="volume" />
          <input
            className="qs__slider"
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Volume"
          />
        </label>
        <div className="qs__toggles">
          {QUICK_TOGGLES.map((toggle) => (
            <button
              key={toggle.id}
              className="qs__toggle"
              aria-pressed={isPressed(toggle)}
              onClick={() => onToggle(toggle)}
            >
              <Icon name={toggle.icon} />
              {toggle.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
