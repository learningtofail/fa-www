import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, THEME_KEY, applyTheme, readTheme, resolveTheme, saveTheme } from "../../src/lib/theme.js";

const blocked = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
};

describe("theme", () => {
  it("resolves known themes and falls back to the default", () => {
    expect(resolveTheme("dark")).toBe("dark");
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("purple")).toBe(DEFAULT_THEME);
    expect(resolveTheme(null)).toBe(DEFAULT_THEME);
  });

  it("round-trips through storage", () => {
    const data = new Map();
    const storage = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
    saveTheme(storage, "dark");
    expect(data.get(THEME_KEY)).toBe("dark");
    expect(readTheme(storage)).toBe("dark");
  });

  it("survives blocked storage", () => {
    expect(readTheme(blocked)).toBe(DEFAULT_THEME);
    expect(() => saveTheme(blocked, "dark")).not.toThrow();
  });

  it("sets data-theme on the root", () => {
    const root = { dataset: {} };
    applyTheme(root, "dark");
    expect(root.dataset.theme).toBe("dark");
  });
});
