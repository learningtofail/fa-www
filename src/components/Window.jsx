import { useRef, useCallback } from "react";
import { isTextEntryTarget } from "../lib/keyboard.js";
import { clampPosition, clampSize } from "../lib/windowGeometry.js";

/**
 * Size of the box the window is positioned in (the desktop surface), falling back to
 * the browser viewport when the element has no layout box.
 * @param {HTMLElement} windowEl
 * @returns {{ width: number, height: number }}
 */
function boundsOf(windowEl) {
  const parent = windowEl.offsetParent;
  if (parent instanceof HTMLElement && parent.clientWidth > 0 && parent.clientHeight > 0) {
    return { width: parent.clientWidth, height: parent.clientHeight };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * Draggable/resizable window chrome. Purely presentational + interaction —
 * position/size/z-index state lives in Desktop.jsx. Dragging uses Pointer Events
 * with pointer capture, so mouse, touch and pen work and no listener outlives the element.
 */
export default function Window({
  id,
  title,
  x,
  y,
  width,
  height,
  zIndex,
  onFocus,
  onClose,
  onMinimize,
  onMove,
  onResize,
  noPadding,
  children,
}) {
  const rootRef = useRef(null);
  /** @type {React.MutableRefObject<null | { mode: "move" | "resize", pointerId: number, startX: number, startY: number, origX: number, origY: number, origW: number, origH: number }>} */
  const gesture = useRef(null);

  const beginGesture = useCallback(
    (mode, e) => {
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      gesture.current = {
        mode,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        origX: x,
        origY: y,
        origW: width,
        origH: height,
      };
    },
    [x, y, width, height],
  );

  const onTitleBarPointerDown = useCallback(
    (e) => {
      // Ignore drags started on the control buttons themselves
      if (e.target.closest("[data-window-control]")) return;
      onFocus(id);
      beginGesture("move", e);
    },
    [id, onFocus, beginGesture],
  );

  const onResizePointerDown = useCallback(
    (e) => {
      e.stopPropagation();
      onFocus(id);
      beginGesture("resize", e);
    },
    [id, onFocus, beginGesture],
  );

  const onGesturePointerMove = useCallback(
    (e) => {
      const g = gesture.current;
      if (!g || g.pointerId !== e.pointerId || !rootRef.current) return;
      const bounds = boundsOf(rootRef.current);
      const dx = e.clientX - g.startX;
      const dy = e.clientY - g.startY;
      if (g.mode === "move") {
        const next = clampPosition({ x: g.origX + dx, y: g.origY + dy }, { width: g.origW, height: g.origH }, bounds);
        onMove(id, next.x, next.y);
      } else {
        const next = clampSize({ width: g.origW + dx, height: g.origH + dy }, { x: g.origX, y: g.origY }, bounds);
        onResize(id, next.width, next.height);
      }
    },
    [id, onMove, onResize],
  );

  const endGesture = useCallback((e) => {
    if (gesture.current?.pointerId !== e.pointerId) return;
    gesture.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }, []);

  // Escape closes the window that holds keyboard focus, except while typing in a field.
  const onKeyDown = useCallback(
    (e) => {
      if (e.key !== "Escape" || isTextEntryTarget(e.target)) return;
      onClose(id);
    },
    [id, onClose],
  );

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the dialog root focuses itself on mouse down and closes on Escape from inside it; keyboard focus handoff arrives in Phase 4 (S11)
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
      ref={rootRef}
      onMouseDown={() => onFocus(id)}
      onKeyDown={onKeyDown}
      role="dialog"
      aria-label={title}
    >
      <div
        className="win-titlebar"
        onPointerDown={onTitleBarPointerDown}
        onPointerMove={onGesturePointerMove}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
      >
        <span>{title}</span>
        <span className="win-titlebar-controls">
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
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrollable window body must be keyboard focusable; gets role and label in Phase 4 (S11) */}
      <div tabIndex={0} className={`win-body${noPadding ? " no-padding" : ""}`}>
        {children}
      </div>
      <div
        className="win-resize-handle"
        onPointerDown={onResizePointerDown}
        onPointerMove={onGesturePointerMove}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
        aria-hidden="true"
      >
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M14 2 L2 14 M14 8 L8 14 M14 14 L14 14" style={{ stroke: "var(--grey-400)" }} strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
}
