import { FIXED_WINDOWS, INITIALLY_OPEN, TOOL_WINDOW } from "../../src/data/windows.js";
import {
  TOOL_PREFIX,
  createInitialState,
  createWindowReducer,
  toolWindowId,
  visibleWindows,
} from "../../src/lib/windowManager.js";

const defaults = { fixed: FIXED_WINDOWS, initiallyOpen: INITIALLY_OPEN, tool: TOOL_WINDOW };
const reduce = createWindowReducer(defaults);
const surface = { width: 1000, height: 600 };
const find = (state, id) => state.windows.find((w) => w.id === id);

describe("createInitialState", () => {
  it("opens about, contact and now, stacked in order, and closes the rest", () => {
    const state = createInitialState(defaults);
    expect(state.windows.map((w) => [w.id, w.open, w.zIndex])).toEqual([
      ["about", true, 1],
      ["contact", true, 2],
      ["now", true, 3],
      ["marketing", false, 0],
      ["terminal", false, 0],
      ["files", false, 0],
      ["weather", false, 0],
      ["calculator", false, 0],
      ["viewer", false, 0],
      ["editor", false, 0],
    ]);
    expect(state.zCounter).toBe(4);
  });
});

describe("open", () => {
  it("opens a closed window on top", () => {
    const state = reduce(createInitialState(defaults), { type: "open", id: "terminal" });
    const terminal = find(state, "terminal");
    expect(terminal).toMatchObject({ open: true, minimized: false });
    expect(terminal.zIndex).toBeGreaterThan(find(state, "now").zIndex);
  });

  it("restores a minimized window", () => {
    let state = reduce(createInitialState(defaults), { type: "minimize", id: "about" });
    state = reduce(state, { type: "open", id: "about" });
    expect(find(state, "about").minimized).toBe(false);
  });

  it("pulls the window inside the surface it is given, so the terminal never sits under the dock", () => {
    const state = reduce(createInitialState(defaults), { type: "open", id: "terminal", surface });
    const t = find(state, "terminal");
    expect(t.y + t.height).toBeLessThanOrEqual(surface.height);
    expect(t.x + t.width).toBeLessThanOrEqual(surface.width);
  });

  it("ignores an unknown id", () => {
    const state = createInitialState(defaults);
    expect(reduce(state, { type: "open", id: "nope" })).toBe(state);
  });
});

describe("openTool and close", () => {
  const open = (state, slug = "utm-auditor") =>
    reduce(state, { type: "openTool", slug, name: "UTM", url: `https://x.test/${slug}/` });

  it("creates a cascading tool window with its url", () => {
    const first = open(createInitialState(defaults));
    const tool = find(first, toolWindowId("utm-auditor"));
    expect(tool).toMatchObject({ isTool: true, title: "UTM", url: "https://x.test/utm-auditor/", open: true });
    expect(tool.id.startsWith(TOOL_PREFIX)).toBe(true);
    const second = open(first, "gtm-auditor");
    const next = find(second, toolWindowId("gtm-auditor"));
    expect(next.x).toBe(tool.x + TOOL_WINDOW.step);
    expect(next.y).toBe(tool.y + TOOL_WINDOW.step);
  });

  it("reuses an existing tool window and brings it to the front", () => {
    let state = open(createInitialState(defaults));
    state = reduce(state, { type: "minimize", id: toolWindowId("utm-auditor") });
    const count = state.windows.length;
    state = open(state);
    expect(state.windows).toHaveLength(count);
    expect(find(state, toolWindowId("utm-auditor"))).toMatchObject({ minimized: false, open: true });
  });

  it("keeps a new tool window inside the surface", () => {
    const state = reduce(createInitialState(defaults), {
      type: "openTool",
      slug: "a",
      name: "A",
      url: "u",
      surface: { width: 500, height: 400 },
    });
    const tool = find(state, toolWindowId("a"));
    expect(tool.x + tool.width).toBeLessThanOrEqual(500);
    expect(tool.y + tool.height).toBeLessThanOrEqual(400);
  });

  it("removes a tool window on close but only hides a fixed one", () => {
    let state = open(createInitialState(defaults));
    state = reduce(state, { type: "close", id: toolWindowId("utm-auditor") });
    expect(find(state, toolWindowId("utm-auditor"))).toBeUndefined();
    state = reduce(state, { type: "close", id: "about" });
    expect(find(state, "about")).toMatchObject({ open: false });
  });

  it("ignores close for an unknown id", () => {
    const state = createInitialState(defaults);
    expect(reduce(state, { type: "close", id: "nope" })).toBe(state);
  });
});

describe("focus, minimize, move, resize", () => {
  it("raises the focused window above the rest and restores it", () => {
    let state = reduce(createInitialState(defaults), { type: "minimize", id: "about" });
    state = reduce(state, { type: "focus", id: "about" });
    const about = find(state, "about");
    expect(about.minimized).toBe(false);
    expect(about.zIndex).toBeGreaterThan(find(state, "now").zIndex);
  });

  it("minimizes without closing", () => {
    const state = reduce(createInitialState(defaults), { type: "minimize", id: "contact" });
    expect(find(state, "contact")).toMatchObject({ open: true, minimized: true });
    expect(visibleWindows(state.windows).map((w) => w.id)).toEqual(["about", "now"]);
  });

  it("moves and resizes one window and leaves the others untouched", () => {
    const start = createInitialState(defaults);
    let state = reduce(start, { type: "move", id: "about", x: 5, y: 6 });
    state = reduce(state, { type: "resize", id: "about", width: 300, height: 200 });
    expect(find(state, "about")).toMatchObject({ x: 5, y: 6, width: 300, height: 200 });
    expect(find(state, "contact")).toBe(find(start, "contact"));
  });

  it.each([
    { type: "focus", id: "nope" },
    { type: "minimize", id: "nope" },
    { type: "move", id: "nope", x: 1, y: 1 },
    { type: "resize", id: "nope", width: 1, height: 1 },
  ])("returns the same state for %j", (action) => {
    const state = createInitialState(defaults);
    expect(reduce(state, /** @type {any} */ (action))).toBe(state);
  });

  it("does not mutate the previous state", () => {
    const state = createInitialState(defaults);
    const snapshot = JSON.stringify(state);
    reduce(state, { type: "move", id: "about", x: 1, y: 1 });
    reduce(state, { type: "open", id: "terminal" });
    expect(JSON.stringify(state)).toBe(snapshot);
  });
});

describe("tile", () => {
  const tokens = { tileMargin: 20, tileGap: 16 };

  it("arranges only visible windows and leaves hidden ones where they were", () => {
    let state = reduce(createInitialState(defaults), { type: "minimize", id: "now" });
    state = reduce(state, { type: "tile", surface, tokens });
    const about = find(state, "about");
    const contact = find(state, "contact");
    expect(about.x).toBe(20);
    expect(contact.x).toBeGreaterThan(about.x);
    expect(find(state, "now")).toMatchObject(FIXED_WINDOWS.now);
    expect(find(state, "marketing")).toMatchObject(FIXED_WINDOWS.marketing);
  });

  it("does nothing when no window is visible", () => {
    let state = createInitialState(defaults);
    for (const id of INITIALLY_OPEN) state = reduce(state, { type: "close", id });
    expect(reduce(state, { type: "tile", surface, tokens })).toBe(state);
  });
});

describe("fit", () => {
  it("clamps open windows into a smaller surface and ignores closed ones", () => {
    const state = reduce(createInitialState(defaults), { type: "fit", surface: { width: 500, height: 400 } });
    for (const w of visibleWindows(state.windows)) {
      expect(w.x + w.width).toBeLessThanOrEqual(500);
      expect(w.y + w.height).toBeLessThanOrEqual(400);
    }
    expect(find(state, "terminal")).toMatchObject(FIXED_WINDOWS.terminal);
  });
});

describe("unknown actions", () => {
  it("return the state unchanged", () => {
    const state = createInitialState(defaults);
    expect(reduce(state, /** @type {any} */ ({ type: "explode" }))).toBe(state);
  });
});
