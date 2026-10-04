import { useCallback, useRef } from "react";
import { measureBounds, readLayoutTokens } from "../lib/layout.js";
import { applyKeyboardGesture, clampPosition, clampSize } from "../lib/windowGeometry.js";

/**
 * Pointer and keyboard move/resize for one window. Pointer Events with capture mean mouse,
 * touch and pen all work and nothing is attached to `window`. Arrow keys on the focused
 * title button move the window, and Shift plus an arrow key resizes it.
 *
 * @param {{
 *   id: string, x: number, y: number, width: number, height: number,
 *   rootRef: React.RefObject<HTMLElement | null>,
 *   onFocus: (id: string) => void,
 *   onMove: (id: string, x: number, y: number) => void,
 *   onResize: (id: string, width: number, height: number) => void,
 * }} options
 */
export function useWindowGestures({ id, x, y, width, height, rootRef, onFocus, onMove, onResize }) {
  /** @type {React.MutableRefObject<null | { mode: "move" | "resize", pointerId: number, startX: number, startY: number }>} */
  const gesture = useRef(null);
  const origin = useRef({ x, y, width, height });

  const begin = useCallback(
    (mode, e) => {
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      origin.current = { x, y, width, height };
      gesture.current = { mode, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY };
    },
    [x, y, width, height],
  );

  const onPointerMove = useCallback(
    (e) => {
      const g = gesture.current;
      if (!g || g.pointerId !== e.pointerId || !rootRef.current) return;
      const bounds = measureBounds(rootRef.current);
      const o = origin.current;
      const dx = e.clientX - g.startX;
      const dy = e.clientY - g.startY;
      if (g.mode === "move") {
        const next = clampPosition({ x: o.x + dx, y: o.y + dy }, o, bounds);
        onMove(id, next.x, next.y);
      } else {
        const next = clampSize({ width: o.width + dx, height: o.height + dy }, o, bounds);
        onResize(id, next.width, next.height);
      }
    },
    [id, rootRef, onMove, onResize],
  );

  const end = useCallback((e) => {
    if (gesture.current?.pointerId !== e.pointerId) return;
    gesture.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }, []);

  const pointerHandlers = { onPointerMove, onPointerUp: end, onPointerCancel: end };

  const onKeyDown = useCallback(
    (e) => {
      if (!rootRef.current) return;
      const { windowKeyStep } = readLayoutTokens();
      const result = applyKeyboardGesture({ x, y, width, height }, e, windowKeyStep, measureBounds(rootRef.current));
      if (!result) return;
      e.preventDefault();
      if (result.kind === "move") onMove(id, result.x, result.y);
      else onResize(id, result.width, result.height);
    },
    [id, x, y, width, height, rootRef, onMove, onResize],
  );

  return {
    titlebarProps: {
      ...pointerHandlers,
      onPointerDown: (e) => {
        // Ignore drags started on the control buttons themselves.
        if (e.target.closest("[data-window-control]")) return;
        onFocus(id);
        begin("move", e);
      },
    },
    resizeHandleProps: {
      ...pointerHandlers,
      onPointerDown: (e) => {
        e.stopPropagation();
        onFocus(id);
        begin("resize", e);
      },
    },
    moveHandleProps: { onKeyDown },
  };
}
