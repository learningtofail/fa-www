import { describe, expect, it } from "vitest";
import { FIXED_WINDOWS, INITIALLY_OPEN, TOOL_WINDOW } from "../../src/data/windows.js";
import { createInitialState, createWindowReducer } from "../../src/lib/windowManager.js";

const defaults = { fixed: FIXED_WINDOWS, initiallyOpen: INITIALLY_OPEN, tool: TOOL_WINDOW };
const reducer = createWindowReducer(defaults);
const surface = { width: 1200, height: 700 };
const find = (state, id) => state.windows.find((w) => w.id === id);

describe("maximize", () => {
  const start = createInitialState(defaults);

  it("fills the surface and remembers the old geometry", () => {
    const before = find(start, "about");
    const next = find(reducer(start, { type: "maximize", id: "about", surface }), "about");
    expect(next).toMatchObject({ x: 0, y: 0, width: 1200, height: 700, maximized: true });
    expect(next.restore).toEqual({ x: before.x, y: before.y, width: before.width, height: before.height });
  });

  it("restores the old geometry on the second call", () => {
    const before = find(start, "about");
    const once = reducer(start, { type: "maximize", id: "about", surface });
    const twice = find(reducer(once, { type: "maximize", id: "about", surface }), "about");
    expect(twice).toMatchObject({ x: before.x, y: before.y, width: before.width, height: before.height });
    expect(twice.maximized).toBe(false);
    expect(twice.restore).toBeUndefined();
  });

  it("does nothing without a surface", () => {
    expect(find(reducer(start, { type: "maximize", id: "about" }), "about").maximized).toBeUndefined();
  });

  it("ignores move and resize while maximized", () => {
    const max = reducer(start, { type: "maximize", id: "about", surface });
    const moved = reducer(max, { type: "move", id: "about", x: 50, y: 50 });
    const resized = reducer(max, { type: "resize", id: "about", width: 100, height: 100 });
    expect(find(moved, "about")).toMatchObject({ x: 0, y: 0 });
    expect(find(resized, "about")).toMatchObject({ width: 1200, height: 700 });
  });

  it("follows the surface when it resizes", () => {
    const max = reducer(start, { type: "maximize", id: "about", surface });
    const fit = reducer(max, { type: "fit", surface: { width: 800, height: 500 } });
    expect(find(fit, "about")).toMatchObject({ width: 800, height: 500, maximized: true });
  });

  it("un-maximizes when Activities tiles the windows", () => {
    const max = reducer(start, { type: "maximize", id: "about", surface });
    const tiled = reducer(max, { type: "tile", surface, tokens: { tileMargin: 20, tileGap: 16 } });
    expect(find(tiled, "about").maximized).toBe(false);
  });
});
