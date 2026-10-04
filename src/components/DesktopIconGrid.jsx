import { useEffect, useState } from "react";
import AppIcon from "./AppIcon.jsx";
import { DESKTOP_ICON_APPS } from "../data/apps.js";

/**
 * Desktop icons. Click selects, double-click or Enter/Space opens.
 * @param {{ onOpen: (id: string) => void }} props
 */
export default function DesktopIconGrid({ onOpen }) {
  const [selected, setSelected] = useState(null);

  // Clicking anywhere that is not an icon clears the selection.
  useEffect(() => {
    const clearOutside = (e) => {
      if (!(e.target instanceof Element) || !e.target.closest(".desktop-icon")) setSelected(null);
    };
    document.addEventListener("pointerdown", clearOutside);
    return () => document.removeEventListener("pointerdown", clearOutside);
  }, []);

  return (
    <div className="desktop-icon-grid">
      {DESKTOP_ICON_APPS.map((app) => (
        <button
          key={app.id}
          className={`desktop-icon${selected === app.id ? " selected" : ""}`}
          onClick={() => setSelected(app.id)}
          onDoubleClick={() => onOpen(app.id)}
          onKeyDown={(e) => {
            // Double-click has no keyboard equivalent by default, so Enter/Space opens directly.
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpen(app.id);
            }
          }}
        >
          <AppIcon glyph={app.glyph} tone={app.tone} size="sm" />
          <span className="desktop-icon-label">{app.label}</span>
        </button>
      ))}
    </div>
  );
}
