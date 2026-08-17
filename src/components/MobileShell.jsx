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
      <h1
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        Faysal Ahmed — desktop
      </h1>
      <div className="app-grid">
        {APPS.map((app) => (
          <button key={app.id} className="app-icon-btn" onClick={() => handleIconTap(app)}>
            <AppIcon glyph={app.glyph} color={app.color} size={52} fontSize={26} />
            <span className="app-icon-label">{app.label}</span>
          </button>
        ))}
      </div>

      {folderOpen && (
        <div className="folder-backdrop" onClick={() => setFolderOpen(false)}>
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
