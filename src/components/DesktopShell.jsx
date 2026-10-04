import { useRef } from "react";
import "../styles/desktop.css";
import TopBar from "./TopBar.jsx";
import Dock from "./Dock.jsx";
import DesktopIconGrid from "./DesktopIconGrid.jsx";
import Window from "./Window.jsx";
import WindowContent from "./WindowContent.jsx";
import { useWindowManager } from "../hooks/useWindowManager.js";

/** Composition only: the window manager owns state, the child components own rendering. */
export default function DesktopShell({ lastDeploy }) {
  const surfaceRef = useRef(null);
  const manager = useWindowManager(surfaceRef);

  return (
    <main className="gnome-root">
      <h1 className="visually-hidden">Faysal Ahmed &mdash; desktop</h1>
      <TopBar onActivities={manager.tile} />

      <div ref={surfaceRef} className="gnome-desktop-surface">
        <DesktopIconGrid onOpen={manager.open} />
        {manager.visible.map((w) => (
          <Window
            key={w.id}
            id={w.id}
            title={w.title}
            x={w.x}
            y={w.y}
            width={w.width}
            height={w.height}
            zIndex={w.zIndex}
            onFocus={manager.focus}
            onClose={manager.close}
            onMinimize={manager.minimize}
            onMove={manager.move}
            onResize={manager.resize}
            noPadding={w.id === "terminal" || w.isTool}
          >
            <WindowContent win={w} lastDeploy={lastDeploy} onOpenTool={manager.openTool} />
          </Window>
        ))}
      </div>

      <Dock windows={manager.windows} onOpen={manager.open} onFocus={manager.focus} />
    </main>
  );
}
