import { useRef, useState } from "react";
import "../styles/mobile.css";
import AppIcon from "./AppIcon.jsx";
import MobileAppView from "./MobileAppView.jsx";
import ToolsFolderContent from "./ToolsFolderContent.jsx";
import { APPS } from "../data/apps.js";
import { useFocusReturn } from "../hooks/useFocusReturn.js";

/**
 * The Tools folder as a popup. Escape or a tap on the backdrop closes it, and focus returns to
 * the folder icon.
 * @param {{ onClose: () => void, onOpenTool: (slug: string, name: string, url: string) => void }} props
 */
function FolderPopup({ onClose, onOpenTool }) {
  const popupRef = useRef(null);
  useFocusReturn(popupRef);
  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- backdrop tap dismisses; the keyboard path is Escape on the dialog and the tool buttons inside
    <div className="folder-backdrop" onClick={onClose}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- stops backdrop dismissal on taps inside, and closes on Escape */}
      <div
        ref={popupRef}
        className="folder-popup"
        role="dialog"
        aria-label="Tools"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      >
        <p className="folder-popup-title">Tools</p>
        <ToolsFolderContent onOpenTool={onOpenTool} dense />
      </div>
    </div>
  );
}

export default function MobileShell({ lastDeploy }) {
  const [folderOpen, setFolderOpen] = useState(false);
  const [openApp, setOpenApp] = useState(null); // { id, title, kind, url? }

  const handleIconTap = (app) => {
    if (app.kind === "folder") {
      setFolderOpen(true);
      return;
    }
    setOpenApp({ id: app.id, title: app.label, kind: app.kind });
  };

  const handleOpenTool = (slug, name, url) => {
    setFolderOpen(false);
    setOpenApp({ id: `tool:${slug}`, title: name, kind: "tool", url });
  };

  return (
    <main className="android-root">
      <h1 className="visually-hidden">Faysal Ahmed &mdash; desktop</h1>
      <div className="app-grid">
        {APPS.map((app) => (
          <button key={app.id} className="app-icon-btn" onClick={() => handleIconTap(app)}>
            <AppIcon glyph={app.glyph} tone={app.tone} size="lg" />
            <span className="app-icon-label">{app.label}</span>
          </button>
        ))}
      </div>
      {folderOpen && <FolderPopup onClose={() => setFolderOpen(false)} onOpenTool={handleOpenTool} />}
      {openApp && (
        <MobileAppView
          app={openApp}
          lastDeploy={lastDeploy}
          onBack={() => setOpenApp(null)}
          onOpenTool={handleOpenTool}
        />
      )}
    </main>
  );
}
