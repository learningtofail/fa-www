import { useRef } from "react";
import { useFocusReturn } from "../hooks/useFocusReturn.js";
import { NO_PADDING_WINDOWS } from "../data/windows.js";
import Icon from "./Icon.jsx";
import WindowContent from "./WindowContent.jsx";

/**
 * Full-screen app on the mobile shell. Focus moves in on open and returns to the home-screen
 * icon (or tool tile) that opened it when the user goes back.
 * Changed from the original: line-icon back button, `onOpenApp`, edge-to-edge bodies for the new apps.
 * @param {{
 *   app: { id: string, title: string, kind: string, url?: string },
 *   lastDeploy: string,
 *   onBack: () => void,
 *   onOpenTool: (slug: string, name: string, url: string) => void,
 *   onOpenApp: (id: string) => void,
 * }} props
 */
export default function MobileAppView({ app, lastDeploy, onBack, onOpenTool, onOpenApp }) {
  const rootRef = useRef(null);
  useFocusReturn(rootRef);
  const bare = app.kind === "terminal" || app.kind === "tool" || NO_PADDING_WINDOWS.has(app.id);
  const win = {
    ...app,
    isTool: app.kind === "tool",
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    open: true,
    minimized: false,
    zIndex: 0,
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Escape closes the view, mirroring the desktop windows
    <div
      ref={rootRef}
      className="app-view"
      role="dialog"
      aria-label={app.title}
      tabIndex={-1}
      onKeyDown={(e) => e.key === "Escape" && e.target === e.currentTarget && onBack()}
    >
      <div className="app-view-header">
        <button className="back-btn" onClick={onBack} aria-label="Back">
          <Icon name="back" />
        </button>
        <span className="app-view-title">{app.title}</span>
      </div>
      <div
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrollable region must be keyboard focusable
        tabIndex={0}
        role="region"
        aria-label={`${app.title} content`}
        className={`app-view-body${bare ? " no-padding" : ""}`}
      >
        <WindowContent win={win} lastDeploy={lastDeploy} onOpenTool={onOpenTool} onOpenApp={onOpenApp} />
      </div>
    </div>
  );
}
