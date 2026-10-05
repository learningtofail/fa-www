import { useState, useEffect } from "react";
import Icon from "./Icon.jsx";
import QuickSettings from "./QuickSettings.jsx";

const PANEL_ID = "quick-settings";

function formatClock(d) {
  const day = d.toLocaleDateString(undefined, { weekday: "short" });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${day} ${time}`;
}

/**
 * @param {{
 *   onActivities: () => void,
 *   theme: "light" | "dark",
 *   onThemeChange: (theme: "light" | "dark") => void,
 * }} props
 */
export default function TopBar({ onActivities, theme, onThemeChange }) {
  const [now, setNow] = useState(() => new Date());
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 15);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div className="gnome-topbar">
        <button className="gnome-activities" onClick={onActivities}>
          Activities
        </button>
        <div className="gnome-clock">{formatClock(now)}</div>
        <div className="gnome-tray">
          <button
            className="gnome-tray__btn"
            aria-label="Quick settings"
            aria-expanded={panelOpen}
            aria-controls={PANEL_ID}
            onClick={() => setPanelOpen((open) => !open)}
          >
            <Icon name="ethernet" />
            <Icon name="volume" />
            <Icon name="power" />
          </button>
        </div>
      </div>
      {panelOpen && (
        <QuickSettings id={PANEL_ID} theme={theme} onThemeChange={onThemeChange} onClose={() => setPanelOpen(false)} />
      )}
    </>
  );
}
