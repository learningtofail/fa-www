import { computeTileLayout, measureBounds, readLayoutTokens, readPxToken } from "../../src/lib/layout.js";
import { MIN_WINDOW_SIZE } from "../../src/lib/windowGeometry.js";

const tokens = { tileMargin: 20, tileGap: 16 };

describe("computeTileLayout", () => {
  it("returns nothing for zero windows", () => {
    expect(computeTileLayout(0, { width: 1000, height: 600 }, tokens)).toEqual([]);
  });

  it("fills the surface with one window", () => {
    expect(computeTileLayout(1, { width: 1000, height: 600 }, tokens)).toEqual([
      { x: 20, y: 20, width: 944, height: 544 },
    ]);
  });

  it("lays three windows out as a 2x2 grid with an empty cell", () => {
    const rects = computeTileLayout(3, { width: 1000, height: 600 }, tokens);
    expect(rects).toHaveLength(3);
    expect(rects[0]).toEqual({ x: 20, y: 20, width: 464, height: 264 });
    expect(rects[1].x).toBe(20 + 480);
    expect(rects[2]).toMatchObject({ x: 20, y: 20 + 280 });
  });

  it("never produces overlapping tiles", () => {
    const rects = computeTileLayout(5, { width: 1200, height: 800 }, tokens);
    for (const [i, a] of rects.entries()) {
      for (const b of rects.slice(i + 1)) {
        const overlap = a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
        expect(overlap).toBe(false);
      }
    }
  });

  it("honours the minimum window size on a tiny surface", () => {
    const [rect] = computeTileLayout(1, { width: 100, height: 100 }, tokens);
    expect(rect.width).toBe(MIN_WINDOW_SIZE.width);
    expect(rect.height).toBe(MIN_WINDOW_SIZE.height);
  });
});

describe("layout tokens", () => {
  afterEach(() => document.documentElement.removeAttribute("style"));

  it("reads px tokens from computed style and treats a missing token as 0", () => {
    document.documentElement.style.setProperty("--tile-margin", "24px");
    expect(readLayoutTokens()).toEqual({ tileMargin: 24, tileGap: 0, windowKeyStep: 0 });
  });

  it("parses plain numbers and rejects garbage", () => {
    const styles = {
      getPropertyValue: (name) => ({ "--a": " 12px", "--b": "calc(1px + 2px)", "--c": "" })[name] ?? "",
    };
    expect(readPxToken(/** @type {any} */ (styles), "--a")).toBe(12);
    expect(readPxToken(/** @type {any} */ (styles), "--b")).toBe(0);
    expect(readPxToken(/** @type {any} */ (styles), "--c")).toBe(0);
  });
});

describe("measureBounds", () => {
  it("uses the offset parent when it has a layout box", () => {
    const parent = document.createElement("div");
    Object.defineProperty(parent, "clientWidth", { value: 800 });
    Object.defineProperty(parent, "clientHeight", { value: 500 });
    const child = document.createElement("div");
    Object.defineProperty(child, "offsetParent", { value: parent });
    expect(measureBounds(child)).toEqual({ width: 800, height: 500 });
  });

  it("falls back to the viewport without a layout box", () => {
    expect(measureBounds(document.createElement("div"))).toEqual({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  });
});
