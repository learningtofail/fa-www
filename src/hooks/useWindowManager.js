import { useCallback, useEffect, useMemo, useReducer } from "react";
import { FIXED_WINDOWS, INITIALLY_OPEN, TOOL_WINDOW } from "../data/windows.js";
import { readLayoutTokens } from "../lib/layout.js";
import { createInitialState, createWindowReducer, visibleWindows } from "../lib/windowManager.js";

/** @type {import("../lib/windowManager.js").WindowDefaults} */
const DEFAULTS = { fixed: FIXED_WINDOWS, initiallyOpen: INITIALLY_OPEN, tool: TOOL_WINDOW };
const reducer = createWindowReducer(DEFAULTS);

/**
 * Window state for the desktop shell. The reducer is pure; this hook measures the desktop
 * surface (the edge where the DOM is read) and hands the size to it.
 * Changed from the original: `maximize`.
 * @param {React.RefObject<HTMLElement | null>} surfaceRef element the windows are positioned in
 */
export function useWindowManager(surfaceRef) {
  const [state, dispatch] = useReducer(reducer, DEFAULTS, createInitialState);

  const measure = useCallback(() => {
    const el = surfaceRef.current;
    return el && el.clientWidth > 0 && el.clientHeight > 0
      ? { width: el.clientWidth, height: el.clientHeight }
      : undefined;
  }, [surfaceRef]);

  // Keep windows inside the surface when the browser window is resized.
  useEffect(() => {
    const el = surfaceRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => {
      const surface = measure();
      if (surface) dispatch({ type: "fit", surface });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [surfaceRef, measure]);

  const actions = useMemo(
    () => ({
      open: (id) => dispatch({ type: "open", id, surface: measure() }),
      openTool: (slug, name, url) => dispatch({ type: "openTool", slug, name, url, surface: measure() }),
      close: (id) => dispatch({ type: "close", id }),
      focus: (id) => dispatch({ type: "focus", id }),
      minimize: (id) => dispatch({ type: "minimize", id }),
      maximize: (id) => dispatch({ type: "maximize", id, surface: measure() }),
      move: (id, x, y) => dispatch({ type: "move", id, x, y }),
      resize: (id, width, height) => dispatch({ type: "resize", id, width, height }),
      tile: () => {
        const surface = measure() ?? { width: window.innerWidth, height: window.innerHeight };
        dispatch({ type: "tile", surface, tokens: readLayoutTokens() });
      },
    }),
    [measure],
  );

  return { windows: state.windows, visible: visibleWindows(state.windows), ...actions };
}
