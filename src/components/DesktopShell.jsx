import { useState, useCallback, useRef } from "react";
import "../styles/desktop.css";
import TopBar from "./TopBar.jsx";
import AppIcon from "./AppIcon.jsx";
import Window from "./Window.jsx";
import AboutContent from "./AboutContent.jsx";
import ContactContent from "./ContactContent.jsx";
import NowContent from "./NowContent.jsx";
import IframeContent from "./IframeContent.jsx";
import ToolsFolderContent from "./ToolsFolderContent.jsx";
import Terminal from "./Terminal.jsx";
import { APPS, DESKTOP_ICON_APPS } from "../data/apps.js";

const FIXED_WINDOWS = {
  about: { title: "about.txt", x: 140, y: 60, width: 420, height: 260 },
  contact: { title: "contact.txt", x: 580, y: 90, width: 380, height: 320 },
  now: { title: "status.txt", x: 180, y: 360, width: 360, height: 190 },
  tools: { title: "Tools", x: 620, y: 420, width: 420, height: 320 },
  terminal: { title: "terminal", x: 480, y: 440, width: 520, height: 300 },
};

const DOCK_APP_IDS = ["about", "contact", "now", "tools", "terminal"];

export default function DesktopShell({ lastDeploy }) {
  const zCounter = useRef(10);
  const [selectedIcon, setSelectedIcon] = useState(null);
  // eslint-disable-next-line react-hooks/refs -- initializer reads and writes zCounter during render; replaced by a pure windowReducer in Phase 4
  const [windows, setWindows] = useState(() => {
    const initial = {};
    let z = 1;
    ["about", "contact", "now"].forEach((id) => {
      initial[id] = { ...FIXED_WINDOWS[id], id, open: true, minimized: false, zIndex: z++ };
    });
    ["tools", "terminal"].forEach((id) => {
      initial[id] = { ...FIXED_WINDOWS[id], id, open: false, minimized: false, zIndex: 0 };
    });
    zCounter.current = z + 1;
    return initial;
  });

  const focusWindow = useCallback((id) => {
    zCounter.current += 1;
    const z = zCounter.current;
    setWindows((prev) => ({ ...prev, [id]: { ...prev[id], zIndex: z, minimized: false } }));
  }, []);

  const openOrFocus = useCallback(
    (id) => {
      setWindows((prev) => ({
        ...prev,
        [id]: { ...(prev[id] || FIXED_WINDOWS[id]), id, open: true, minimized: false },
      }));
      focusWindow(id);
    },
    [focusWindow],
  );

  const closeWindow = useCallback((id) => {
    setWindows((prev) => {
      if (id.startsWith("tool:")) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { ...prev[id], open: false } };
    });
  }, []);

  const minimizeWindow = useCallback((id) => {
    setWindows((prev) => ({ ...prev, [id]: { ...prev[id], minimized: true } }));
  }, []);

  const moveWindow = useCallback((id, x, y) => {
    setWindows((prev) => ({ ...prev, [id]: { ...prev[id], x, y } }));
  }, []);

  const resizeWindow = useCallback((id, width, height) => {
    setWindows((prev) => ({ ...prev, [id]: { ...prev[id], width, height } }));
  }, []);

  const openToolWindow = useCallback((slug, name, url) => {
    const id = `tool:${slug}`;
    zCounter.current += 1;
    const z = zCounter.current;
    setWindows((prev) => ({
      ...prev,
      [id]: prev[id]
        ? { ...prev[id], open: true, minimized: false, zIndex: z }
        : {
            id,
            title: name,
            x: 160 + Object.keys(prev).length * 12,
            y: 120 + Object.keys(prev).length * 12,
            width: 640,
            height: 480,
            open: true,
            minimized: false,
            zIndex: z,
            isTool: true,
            url,
          },
    }));
  }, []);

  // "Activities" — GNOME-lite: tile every open, non-minimized window into a
  // simple non-overlapping grid rather than a full Expose-style overview.
  const tileWindows = useCallback(() => {
    setWindows((prev) => {
      const openIds = Object.values(prev)
        .filter((w) => w.open && !w.minimized)
        .map((w) => w.id);
      if (openIds.length === 0) return prev;
      const cols = Math.ceil(Math.sqrt(openIds.length));
      const cellW = Math.floor((window.innerWidth - 40) / cols);
      const cellH = Math.floor((window.innerHeight - 30 - 44 - 40) / Math.ceil(openIds.length / cols));
      const next = { ...prev };
      openIds.forEach((id, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        next[id] = {
          ...next[id],
          x: 20 + col * cellW,
          y: 40 + row * cellH,
          width: cellW - 16,
          height: cellH - 16,
        };
      });
      return next;
    });
  }, []);

  const handleIconClick = (id) => setSelectedIcon(id);
  const handleDesktopClick = (e) => {
    if (e.target === e.currentTarget) setSelectedIcon(null);
  };

  const visibleWindows = Object.values(windows).filter((w) => w.open && !w.minimized);

  return (
    <main className="gnome-root">
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
      <TopBar onActivities={tileWindows} />

      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- background click only clears the icon selection and has a keyboard path through Tab; revisit in Phase 4 (S11) */}
      <div className="gnome-desktop-surface" onClick={handleDesktopClick}>
        <div className="desktop-icon-grid">
          {DESKTOP_ICON_APPS.map((app) => (
            <button
              key={app.id}
              className={`desktop-icon${selectedIcon === app.id ? " selected" : ""}`}
              onClick={() => handleIconClick(app.id)}
              onDoubleClick={() => openOrFocus(app.id)}
              onKeyDown={(e) => {
                // Double-click has no keyboard equivalent by default — Enter/Space
                // opens directly rather than requiring a "select" step first.
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openOrFocus(app.id);
                }
              }}
            >
              <AppIcon glyph={app.glyph} color={app.color} size={40} />
              <span className="desktop-icon-label">{app.label}</span>
            </button>
          ))}
        </div>

        {visibleWindows.map((w) => (
          <Window
            key={w.id}
            id={w.id}
            title={w.title}
            x={w.x}
            y={w.y}
            width={w.width}
            height={w.height}
            zIndex={w.zIndex}
            onFocus={focusWindow}
            onClose={closeWindow}
            onMinimize={minimizeWindow}
            onMove={moveWindow}
            onResize={resizeWindow}
            noPadding={w.id === "terminal" || w.isTool}
          >
            {w.id === "about" && <AboutContent />}
            {w.id === "contact" && <ContactContent />}
            {w.id === "now" && <NowContent lastDeploy={lastDeploy} />}
            {w.id === "tools" && <ToolsFolderContent onOpenTool={openToolWindow} />}
            {w.id === "terminal" && <Terminal onOpenTool={openToolWindow} />}
            {w.isTool && <IframeContent url={w.url} label={w.title} />}
          </Window>
        ))}
      </div>

      <div className="gnome-dock">
        {DOCK_APP_IDS.map((id) => {
          const app = APPS.find((a) => a.id === id);
          const w = windows[id];
          const running = w?.open;
          return (
            <button
              key={id}
              className={`dock-icon-btn${running ? " running" : ""}`}
              onClick={() => openOrFocus(id)}
              title={app.label}
              aria-label={app.label}
            >
              <AppIcon glyph={app.glyph} color={app.color} size={32} />
            </button>
          );
        })}
        {Object.values(windows)
          .filter((w) => w.isTool && w.open)
          .map((w) => (
            <button
              key={w.id}
              className="dock-icon-btn running"
              onClick={() => focusWindow(w.id)}
              title={w.title}
              aria-label={w.title}
            >
              <AppIcon glyph={"\u{1F527}"} color="#3a5a9b" size={32} />
            </button>
          ))}
      </div>
    </main>
  );
}
