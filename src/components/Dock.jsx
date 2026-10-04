import AppIcon from "./AppIcon.jsx";
import { APPS } from "../data/apps.js";
import { DOCK_APP_IDS } from "../data/windows.js";
import { TOOL_ICON } from "../data/tools.js";

/**
 * The floating dock: one button per app, then one per open tool window.
 * @param {{
 *   windows: import("../lib/windowManager.js").WindowState[],
 *   onOpen: (id: string) => void,
 *   onFocus: (id: string) => void,
 * }} props
 */
export default function Dock({ windows, onOpen, onFocus }) {
  return (
    <div className="gnome-dock">
      {DOCK_APP_IDS.map((id) => {
        const app = APPS.find((a) => a.id === id);
        if (!app) return null;
        const running = windows.find((w) => w.id === id)?.open;
        return (
          <button
            key={id}
            className={`dock-icon-btn${running ? " running" : ""}`}
            onClick={() => onOpen(id)}
            title={app.label}
            aria-label={app.label}
          >
            <AppIcon glyph={app.glyph} tone={app.tone} size="xs" />
          </button>
        );
      })}
      {windows
        .filter((w) => w.isTool && w.open)
        .map((w) => (
          <button
            key={w.id}
            className="dock-icon-btn running"
            onClick={() => onFocus(w.id)}
            title={w.title}
            aria-label={w.title}
          >
            <AppIcon {...TOOL_ICON} size="xs" />
          </button>
        ))}
    </div>
  );
}
