import {
  MIN_WINDOW_SIZE,
  applyKeyboardGesture,
  clamp,
  clampPosition,
  clampSize,
} from "../../src/lib/windowGeometry.js";

const viewport = { width: 1000, height: 600 };

describe("clamp", () => {
  it("limits to the range and lets min win when inverted", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(50, 0, 10)).toBe(10);
    expect(clamp(5, 0, -20)).toBe(0);
  });
});

describe("clampPosition", () => {
  const size = { width: 400, height: 300 };

  it("leaves a position inside the viewport alone", () => {
    expect(clampPosition({ x: 100, y: 50 }, size, viewport)).toEqual({ x: 100, y: 50 });
  });

  it("stops at every edge", () => {
    expect(clampPosition({ x: -50, y: -50 }, size, viewport)).toEqual({ x: 0, y: 0 });
    expect(clampPosition({ x: 5000, y: 5000 }, size, viewport)).toEqual({ x: 600, y: 300 });
  });

  it("pins a window larger than the viewport to the origin", () => {
    expect(clampPosition({ x: 40, y: 40 }, { width: 2000, height: 900 }, viewport)).toEqual({ x: 0, y: 0 });
  });
});

describe("clampSize", () => {
  it("applies the minimum size", () => {
    expect(clampSize({ width: 10, height: 10 }, { x: 0, y: 0 }, viewport)).toEqual(MIN_WINDOW_SIZE);
  });

  it("stops growth at the viewport edge from the origin", () => {
    expect(clampSize({ width: 5000, height: 5000 }, { x: 200, y: 100 }, viewport)).toEqual({ width: 800, height: 500 });
  });

  it("never drops below the minimum when the origin is near the edge", () => {
    expect(clampSize({ width: 500, height: 500 }, { x: 990, y: 590 }, viewport)).toEqual(MIN_WINDOW_SIZE);
  });
});

describe("applyKeyboardGesture", () => {
  const rect = { x: 100, y: 100, width: 400, height: 300 };

  it.each([
    ["ArrowLeft", { kind: "move", x: 84, y: 100 }],
    ["ArrowRight", { kind: "move", x: 116, y: 100 }],
    ["ArrowUp", { kind: "move", x: 100, y: 84 }],
    ["ArrowDown", { kind: "move", x: 100, y: 116 }],
  ])("%s moves by one step", (key, expected) => {
    expect(applyKeyboardGesture(rect, { key, shiftKey: false }, 16, viewport)).toEqual(expected);
  });

  it.each([
    ["ArrowLeft", { kind: "resize", width: 384, height: 300 }],
    ["ArrowRight", { kind: "resize", width: 416, height: 300 }],
    ["ArrowUp", { kind: "resize", width: 400, height: 284 }],
    ["ArrowDown", { kind: "resize", width: 400, height: 316 }],
  ])("Shift+%s resizes by one step", (key, expected) => {
    expect(applyKeyboardGesture(rect, { key, shiftKey: true }, 16, viewport)).toEqual(expected);
  });

  it("keeps a moved window inside the viewport and a resized one above the minimum", () => {
    expect(applyKeyboardGesture({ ...rect, x: 0 }, { key: "ArrowLeft", shiftKey: false }, 16, viewport)).toEqual({
      kind: "move",
      x: 0,
      y: 100,
    });
    expect(applyKeyboardGesture({ ...rect, width: 240 }, { key: "ArrowLeft", shiftKey: true }, 16, viewport)).toEqual({
      kind: "resize",
      width: 240,
      height: 300,
    });
  });

  it("ignores every other key, including inherited property names", () => {
    for (const key of ["Enter", "a", "Tab", "constructor"]) {
      expect(applyKeyboardGesture(rect, { key, shiftKey: false }, 16, viewport)).toBeNull();
    }
  });
});
