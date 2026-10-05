import { useCallback, useId, useRef } from "react";
import "../styles/window-controls.css";
import Icon from "./Icon.jsx";
import { useFocusReturn } from "../hooks/useFocusReturn.js";
import { useWindowGestures } from "../hooks/useWindowGestures.js";
import { isTextEntryTarget } from "../lib/keyboard.js";

/**
 * Window chrome: titlebar, controls, body and resize handle. Position, size and stacking live in
 * the window manager; gestures live in `useWindowGestures`.
 * Changes from the original: `maximized` and `onMaximize` props, a maximize button between minimize
 * and close, double-click on the titlebar toggles maximize, and the resize handle hides while maximized.
 */
export default function Window({
  id,
  title,
  x,
  y,
  width,
  height,
  zIndex,
  maximized = false,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onMove,
  onResize,
  noPadding,
  children,
}) {
  const rootRef = useRef(null);
  const hintId = useId();
  useFocusReturn(rootRef);
  const { titlebarProps, resizeHandleProps, moveHandleProps } = useWindowGestures({
    id,
    x,
    y,
    width,
    height,
    rootRef,
    onFocus,
    onMove,
    onResize,
  });

  // Escape closes the window that holds keyboard focus, except while typing in a field.
  const onKeyDown = useCallback(
    (e) => {
      if (e.key !== "Escape" || isTextEntryTarget(e.target)) return;
      onClose(id);
    },
    [id, onClose],
  );

  const onTitlebarDoubleClick = useCallback(
    (e) => {
      if (e.target.closest("[data-window-control]")) return;
      onMaximize(id);
    },
    [id, onMaximize],
  );

  const geometry = /** @type {React.CSSProperties} */ ({
    "--window-x": `${x}px`,
    "--window-y": `${y}px`,
    "--window-width": `${width}px`,
    "--window-height": `${height}px`,
    "--window-z": zIndex,
  });
  const maximizeLabel = `${maximized ? "Restore" : "Maximize"} ${title}`;

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the dialog root focuses itself on mouse down and closes on Escape from inside it
    <div
      ref={rootRef}
      className={`win${maximized ? " win--maximized" : ""}`}
      // eslint-disable-next-line react/forbid-dom-props -- sets geometry custom properties only (the documented inline-style exception in CLAUDE.md); all skin lives in desktop.css
      style={geometry}
      onMouseDown={() => onFocus(id)}
      onKeyDown={onKeyDown}
      role="dialog"
      aria-label={title}
      tabIndex={-1}
    >
      <div className="win-titlebar" {...titlebarProps} onDoubleClick={onTitlebarDoubleClick}>
        <button className="win-title" aria-describedby={hintId} {...moveHandleProps}>
          {title}
        </button>
        <span id={hintId} className="visually-hidden">
          Arrow keys move this window. Shift plus arrow keys resize it.
        </span>
        <span className="win-titlebar-controls">
          <button
            className="win-btn win-btn--min"
            data-window-control
            onClick={() => onMinimize(id)}
            aria-label={`Minimize ${title}`}
          >
            <Icon name="minimize" className="win-btn__glyph" />
          </button>
          <button
            className="win-btn win-btn--max"
            data-window-control
            onClick={() => onMaximize(id)}
            aria-label={maximizeLabel}
          >
            <Icon name={maximized ? "restore" : "maximize"} className="win-btn__glyph" />
          </button>
          <button
            className="win-btn win-btn--close"
            data-window-control
            onClick={() => onClose(id)}
            aria-label={`Close ${title}`}
          >
            <Icon name="close" className="win-btn__glyph" />
          </button>
        </span>
      </div>
      <div
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrollable window body must be keyboard focusable
        tabIndex={0}
        role="region"
        aria-label={`${title} content`}
        className={`win-body${noPadding ? " no-padding" : ""}`}
      >
        {children}
      </div>
      {!maximized && (
        <div className="win-resize-handle" {...resizeHandleProps} aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path className="win-resize-handle__glyph" d="M14 2 L2 14 M14 8 L8 14 M14 14 L14 14" strokeWidth="1.5" />
          </svg>
        </div>
      )}
    </div>
  );
}
