import { MIN_WINDOW_SIZE, clamp, clampPosition, clampSize } from "../../src/lib/windowGeometry.js";

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
