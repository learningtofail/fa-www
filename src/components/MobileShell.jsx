import { useState } from "react";
import "../styles/mobile.css";
import AppIcon from "./AppIcon.jsx";
import MobileAppView from "./MobileAppView.jsx";
import MobileFolderPopup from "./MobileFolderPopup.jsx";
import MobileStatusBar from "./MobileStatusBar.jsx";
import QuickSettings from "./QuickSettings.jsx";
import { APPS } from "../data/apps.js";
import { MOBILE_DOCK_IDS } from "../data/windows.js";
import { useNow } from "../hooks/useNow.js";
import { formatDate, formatTime } from "../lib/clock.js";

const PANEL_ID = "quick-settings-mobile";
const DOCK_APPS = MOBILE_DOCK_IDS.map((id) => APPS.find((a) => a.id === id)).filter(Boolean);

/**
 * GNOME-mobile home: status bar, large clock, app grid, dock. Apps open full screen in
 * `MobileAppView`; the Tools and Marketing folders are popups; the status bar opens Quick Settings as a sheet.
 * @param {{
 *   lastDeploy: string,
 *   theme?: "light" | "dark",
 *   onThemeChange?: (theme: "light" | "dark") => void,
 * }} props
 */
export default function MobileShell({ lastDeploy, theme = "light", onThemeChange = () => {} }) {
  const now = useNow();
  const [folderOpen, setFolderOpen] = useState(/** @type {string | null} */ (null)); // id of the open folder
  const [panelOpen, setPanelOpen] = useState(false);
  const [openApp, setOpenApp] = useState(null); // { id, title, kind, url? }

  const handleIconTap = (app) => {
    if (app.kind === "folder") {
      setFolderOpen(app.id);
      return;
    }
    setOpenApp({ id: app.id, title: app.label, kind: app.kind });
  };

  const handleOpenTool = (slug, name, url) => {
    setFolderOpen(null);
    setOpenApp({ id: `tool:${slug}`, title: name, kind: "tool", url });
  };

  const handleOpenApp = (id) => {
    const app = APPS.find((a) => a.id === id);
    if (app) handleIconTap(app);
  };

  const renderTile = (app, size, className) => (
    <button key={app.id} className={className} onClick={() => handleIconTap(app)} aria-label={app.label}>
      <AppIcon glyph={app.glyph} tone={app.tone} size={size} />
      {size === "lg" && <span className="app-icon-label">{app.label}</span>}
    </button>
  );

  return (
    <main className="android-root">
      <h1 className="visually-hidden">Faysal Ahmed &mdash; desktop</h1>
      <MobileStatusBar
        time={formatTime(now)}
        expanded={panelOpen}
        controls={PANEL_ID}
        onToggle={() => setPanelOpen((open) => !open)}
      />
      <div className="mobile-home">
        <div className="mobile-clock">
          <p className="mobile-clock__time">{formatTime(now)}</p>
          <p className="mobile-clock__date">{formatDate(now)}</p>
        </div>
        <div className="app-grid">{APPS.map((app) => renderTile(app, "lg", "app-icon-btn"))}</div>
        <nav className="mobile-dock" aria-label="Dock">
          {DOCK_APPS.map((app) => renderTile(app, "md", "mobile-dock__btn"))}
        </nav>
      </div>
      {panelOpen && (
        <QuickSettings
          id={PANEL_ID}
          variant="sheet"
          theme={theme}
          onThemeChange={onThemeChange}
          onClose={() => setPanelOpen(false)}
        />
      )}
      {folderOpen && (
        <MobileFolderPopup folder={folderOpen} onClose={() => setFolderOpen(null)} onOpenTool={handleOpenTool} />
      )}
      {openApp && (
        <MobileAppView
          app={openApp}
          lastDeploy={lastDeploy}
          onBack={() => setOpenApp(null)}
          onOpenTool={handleOpenTool}
          onOpenApp={handleOpenApp}
        />
      )}
    </main>
  );
}
