import { useState } from "react";
import "../styles/mobile.css";
import AppIcon from "./AppIcon.jsx";
import AboutContent from "./AboutContent.jsx";
import ContactContent from "./ContactContent.jsx";
import NowContent from "./NowContent.jsx";
import IframeContent from "./IframeContent.jsx";
import ToolsFolderContent from "./ToolsFolderContent.jsx";
import Terminal from "./Terminal.jsx";
import { APPS } from "../data/apps.js";

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
      <h1 className="visually-hidden">Faysal Ahmed — desktop</h1>
      <div className="app-grid">
        {APPS.map((app) => (
          <button key={app.id} className="app-icon-btn" onClick={() => handleIconTap(app)}>
            <AppIcon glyph={app.glyph} tone={app.tone} size="lg" />
            <span className="app-icon-label">{app.label}</span>
          </button>
        ))}
      </div>

      {folderOpen && (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- modal backdrop dismiss; Escape and focus handling arrive with useFocusReturn in Phase 4 (S11)
        <div className="folder-backdrop" onClick={() => setFolderOpen(false)}>
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- stops backdrop dismissal when the popup itself is clicked */}
          <div className="folder-popup" onClick={(e) => e.stopPropagation()}>
            <p className="folder-popup-title">Tools</p>
            <ToolsFolderContent onOpenTool={handleOpenTool} dense />
          </div>
        </div>
      )}

      {openApp && (
        <div className="app-view">
          <div className="app-view-header">
            <button className="back-btn" onClick={() => setOpenApp(null)} aria-label="Back">
              &#8592;
            </button>
            <span className="app-view-title">{openApp.title}</span>
          </div>
          <div
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrollable region must be keyboard focusable; gets role and label in Phase 4 (S11)
            tabIndex={0}
            className={`app-view-body${openApp.kind === "terminal" || openApp.kind === "tool" ? " no-padding" : ""}`}
          >
            {openApp.kind === "window" && openApp.id === "about" && <AboutContent />}
            {openApp.kind === "window" && openApp.id === "contact" && <ContactContent />}
            {openApp.kind === "window" && openApp.id === "now" && <NowContent lastDeploy={lastDeploy} />}
            {openApp.kind === "terminal" && <Terminal onOpenTool={handleOpenTool} />}
            {openApp.kind === "tool" && <IframeContent url={openApp.url} label={openApp.title} />}
          </div>
        </div>
      )}
    </main>
  );
}
