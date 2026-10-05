import { describe, expect, it } from "vitest";
import { formatDate, formatTime, pad } from "../../src/lib/clock.js";
import { DEFAULT_ZOOM, ZOOM_STEPS, stepZoom } from "../../src/lib/zoom.js";

describe("clock", () => {
  it("pads and formats 24-hour time", () => {
    expect(pad(5)).toBe("05");
    expect(formatTime(new Date(2026, 9, 5, 9, 5))).toBe("09:05");
    expect(formatTime(new Date(2026, 9, 5, 23, 59))).toBe("23:59");
  });

  it("formats a long date that contains the day of the month", () => {
    expect(formatDate(new Date(2026, 9, 5))).toContain("5");
  });
});

describe("zoom", () => {
  it("steps up and down through ZOOM_STEPS", () => {
    expect(stepZoom(100, 1)).toBe(150);
    expect(stepZoom(100, -1)).toBe(75);
  });

  it("stops at either end", () => {
    expect(stepZoom(ZOOM_STEPS[0], -1)).toBe(ZOOM_STEPS[0]);
    expect(stepZoom(ZOOM_STEPS[ZOOM_STEPS.length - 1], 1)).toBe(ZOOM_STEPS[ZOOM_STEPS.length - 1]);
  });

  it("recovers from a value that is not a step", () => {
    expect(stepZoom(60, 1)).toBe(stepZoom(DEFAULT_ZOOM, 1));
  });
});
