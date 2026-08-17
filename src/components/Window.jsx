import { useRef, useCallback } from "react";

const MIN_WIDTH = 240;
const MIN_HEIGHT = 160;

/**
 * Draggable/resizable window chrome. Purely presentational + interaction —
 * position/size/z-index state lives in Desktop.jsx.
 */
export default function Window({ id, title, x, y, width, height, zIndex, onFocus, onClose, onMinimize, onMove, onResize, noPadding, children }) {
  const dragState = useRef(null);
  const resizeState = useRef(null);

  const onTitleBarMouseDown = useCallback(
    (e) => {
      // Ignore drags started on the control buttons themselves
      if (e.target.closest("[data-window-control]")) return;
      onFocus(id);
      dragState.current = { startX: e.clientX, startY: e.clientY, origX: x, origY: y };
      const onMouseMove = (ev) => {
        if (!dragState.current) return;
        const dx = ev.clientX - dragState.current.startX;
        const dy = ev.clientY - dragState.current.startY;
        onMove(id, Math.max(0, dragState.current.origX + dx), Math.max(0, dragState.current.origY + dy));
      };
      const onMouseUp = () => {
        dragState.current = null;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [id, x, y, onFocus, onMove]
  );

  const onResizeHandleMouseDown = useCallback(
    (e) => {
      e.stopPropagation();
      onFocus(id);
      resizeState.current = { startX: e.clientX, startY: e.clientY, origW: width, origH: height };
      const onMouseMove = (ev) => {
        if (!resizeState.current) return;
        const dx = ev.clientX - resizeState.current.startX;
        const dy = ev.clientY - resizeState.current.startY;
        onResize(
          id,
          Math.max(MIN_WIDTH, resizeState.current.origW + dx),
          Math.max(MIN_HEIGHT, resizeState.current.origH + dy)
        );
      };
      const onMouseUp = () => {
        resizeState.current = null;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [id, width, height, onFocus, onResize]
  );

  return (
    <div
      className="win"
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        zIndex,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
      onMouseDown={() => onFocus(id)}
      role="dialog"
      aria-label={title}
    >
      <div
        className="win-titlebar"
        onMouseDown={onTitleBarMouseDown}
        style={{
          padding: "0.4rem 0.6rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "move",
          fontSize: "0.8rem",
          fontFamily: "system-ui, sans-serif",
          userSelect: "none",
        }}
      >
        <span>{title}</span>
        <span style={{ display: "flex", gap: "0.3rem" }}>
          <button
            className="win-btn"
            data-window-control
            onClick={() => onMinimize(id)}
            aria-label={`Minimize ${title}`}
          >
            &#8211;
          </button>
          <button className="win-btn" data-window-control onClick={() => onClose(id)} aria-label={`Close ${title}`}>
            &#10005;
          </button>
        </span>
      </div>
      <div
        tabIndex={0}
        style={{ flex: 1, overflow: "auto", padding: noPadding ? 0 : "0.9rem", fontFamily: "system-ui, sans-serif" }}
      >
        {children}
      </div>
      <div
        onMouseDown={onResizeHandleMouseDown}
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: 16,
          height: 16,
          cursor: "nwse-resize",
        }}
        aria-hidden="true"
      >
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M14 2 L2 14 M14 8 L8 14 M14 14 L14 14" stroke="#999" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
}
