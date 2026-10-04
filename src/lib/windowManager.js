import { computeTileLayout } from "./layout.js";
import { clampPosition, clampSize } from "./windowGeometry.js";

/**
 * Pure window state for the desktop shell. `windowReducer` never touches the DOM: anything that
 * depends on the screen (the desktop surface size, layout tokens) arrives in the action.
 *
 * @typedef {{
 *   id: string, title: string, x: number, y: number, width: number, height: number,
 *   open: boolean, minimized: boolean, zIndex: number, isTool?: boolean, url?: string,
 * }} WindowState
 * @typedef {{ windows: WindowState[], zCounter: number }} WindowsState
 * @typedef {{ width: number, height: number }} Surface
 * @typedef {{
 *   fixed: Record<string, { title: string, x: number, y: number, width: number, height: number }>,
 *   initiallyOpen: string[],
 *   tool: { x: number, y: number, width: number, height: number, step: number },
 * }} WindowDefaults
 *
 * @typedef {{ type: "open", id: string, surface?: Surface }
 *   | { type: "openTool", slug: string, name: string, url: string, surface?: Surface }
 *   | { type: "close", id: string }
 *   | { type: "focus", id: string }
 *   | { type: "minimize", id: string }
 *   | { type: "move", id: string, x: number, y: number }
 *   | { type: "resize", id: string, width: number, height: number }
 *   | { type: "tile", surface: Surface, tokens: Pick<import("./layout.js").LayoutTokens, "tileMargin" | "tileGap"> }
 *   | { type: "fit", surface: Surface }} WindowAction
 */

/** Id prefix for tool windows. Fixed app ids never contain a colon. */
export const TOOL_PREFIX = "tool:";

/**
 * @param {string} slug
 * @returns {string}
 */
export const toolWindowId = (slug) => `${TOOL_PREFIX}${slug}`;

/**
 * @param {WindowDefaults} defaults
 * @returns {WindowsState} about/contact/now open and stacked in order, the rest closed
 */
export function createInitialState(defaults) {
  let z = 0;
  const windows = Object.entries(defaults.fixed).map(([id, geometry]) => {
    const open = defaults.initiallyOpen.includes(id);
    return { ...geometry, id, open, minimized: false, zIndex: open ? ++z : 0 };
  });
  return { windows, zCounter: z + 1 };
}

/**
 * @param {WindowState[]} windows
 * @returns {WindowState[]} open, non-minimized windows
 */
export const visibleWindows = (windows) => windows.filter((w) => w.open && !w.minimized);

/**
 * @param {WindowState} win
 * @param {Surface | undefined} surface
 * @returns {WindowState} `win` with size and position pulled inside `surface`
 */
function fitToSurface(win, surface) {
  if (!surface) return win;
  const size = clampSize({ width: win.width, height: win.height }, { x: 0, y: 0 }, surface);
  const position = clampPosition({ x: win.x, y: win.y }, size, surface);
  return { ...win, ...size, ...position };
}

/**
 * @param {WindowsState} state
 * @param {string} id
 * @param {(win: WindowState) => WindowState} update
 * @returns {WindowsState} unchanged (same reference) when `id` is unknown
 */
function updateWindow(state, id, update) {
  if (!state.windows.some((w) => w.id === id)) return state;
  return { ...state, windows: state.windows.map((w) => (w.id === id ? update(w) : w)) };
}

/**
 * Raises a window to the top of the stack and restores it if minimized.
 * @param {WindowsState} state
 * @param {string} id
 * @returns {WindowsState}
 */
function raise(state, id) {
  const zIndex = state.zCounter + 1;
  const next = updateWindow(state, id, (w) => ({ ...w, zIndex, minimized: false }));
  return next === state ? state : { ...next, zCounter: zIndex };
}

/**
 * @param {WindowDefaults} defaults
 * @returns {(state: WindowsState, action: WindowAction) => WindowsState}
 */
export function createWindowReducer(defaults) {
  return function windowReducer(state, action) {
    switch (action.type) {
      case "open": {
        const opened = updateWindow(state, action.id, (w) =>
          fitToSurface({ ...w, open: true, minimized: false }, action.surface),
        );
        return raise(opened, action.id);
      }

      case "openTool": {
        const id = toolWindowId(action.slug);
        if (state.windows.some((w) => w.id === id)) {
          return raise(
            updateWindow(state, id, (w) => ({ ...w, open: true })),
            id,
          );
        }
        const offset = state.windows.length * defaults.tool.step;
        const created = fitToSurface(
          {
            id,
            title: action.name,
            x: defaults.tool.x + offset,
            y: defaults.tool.y + offset,
            width: defaults.tool.width,
            height: defaults.tool.height,
            open: true,
            minimized: false,
            zIndex: 0,
            isTool: true,
            url: action.url,
          },
          action.surface,
        );
        return raise({ ...state, windows: [...state.windows, created] }, id);
      }

      case "close": {
        const target = state.windows.find((w) => w.id === action.id);
        if (!target) return state;
        if (target.isTool) return { ...state, windows: state.windows.filter((w) => w.id !== action.id) };
        return updateWindow(state, action.id, (w) => ({ ...w, open: false }));
      }

      case "focus":
        return raise(state, action.id);

      case "minimize":
        return updateWindow(state, action.id, (w) => ({ ...w, minimized: true }));

      case "move":
        return updateWindow(state, action.id, (w) => ({ ...w, x: action.x, y: action.y }));

      case "resize":
        return updateWindow(state, action.id, (w) => ({ ...w, width: action.width, height: action.height }));

      case "tile": {
        const ids = visibleWindows(state.windows).map((w) => w.id);
        if (ids.length === 0) return state;
        const rects = computeTileLayout(ids.length, action.surface, action.tokens);
        return {
          ...state,
          windows: state.windows.map((w) => {
            const index = ids.indexOf(w.id);
            return index === -1 ? w : { ...w, ...rects[index] };
          }),
        };
      }

      case "fit":
        return { ...state, windows: state.windows.map((w) => (w.open ? fitToSurface(w, action.surface) : w)) };

      default:
        return state;
    }
  };
}
