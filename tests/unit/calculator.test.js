import { describe, expect, it } from "vitest";
import { CALC_KEYS, evaluate, keyFromEvent, pressKey } from "../../src/lib/calculator.js";

describe("evaluate", () => {
  it.each([
    ["2+3", "5"],
    ["2+3×4", "14"],
    ["(2+3)×4", "20"],
    ["10÷4", "2.5"],
    ["50%", "0.5"],
    ["200×10%", "20"],
    ["-3+5", "2"],
    ["2×-3", "-6"],
    [".5+.25", "0.75"],
    ["0.1+0.2", "0.3"],
    ["5.", "5"],
  ])("%s = %s", (expr, expected) => {
    expect(evaluate(expr)).toBe(expected);
  });

  it.each(["", "2+", "(2+3", "2+3)", "abc", "1÷0", "2+*3"])("rejects %j", (expr) => {
    expect(evaluate(expr)).toBeNull();
  });
});

describe("pressKey", () => {
  it("replaces the leading zero with a digit", () => {
    expect(pressKey("0", "7")).toBe("7");
    expect(pressKey("0", ".")).toBe(".");
  });
  it("keeps the zero in front of an operator", () => {
    expect(pressKey("0", "+")).toBe("0+");
  });
  it("appends to a started expression", () => {
    expect(pressKey("7", "8")).toBe("78");
  });
  it("evaluates on equals and shows Error for invalid input", () => {
    expect(pressKey("2+2", "=")).toBe("4");
    expect(pressKey("2+", "=")).toBe("Error");
  });
  it("recovers from Error", () => {
    expect(pressKey("Error", "5")).toBe("5");
    expect(pressKey("Error", "+")).toBe("0+");
    expect(pressKey("Error", "⌫")).toBe("0");
  });
  it("clears and backspaces", () => {
    expect(pressKey("12+3", "C")).toBe("0");
    expect(pressKey("12+3", "⌫")).toBe("12+");
    expect(pressKey("1", "⌫")).toBe("0");
  });
});

describe("keyFromEvent", () => {
  it("maps keyboard keys to calculator keys", () => {
    expect(keyFromEvent("Enter")).toBe("=");
    expect(keyFromEvent("*")).toBe("×");
    expect(keyFromEvent("/")).toBe("÷");
    expect(keyFromEvent("Backspace")).toBe("⌫");
    expect(keyFromEvent("7")).toBe("7");
    expect(keyFromEvent("-")).toBe("-");
  });
  it("ignores everything else", () => {
    expect(keyFromEvent("a")).toBeNull();
    expect(keyFromEvent("Tab")).toBeNull();
  });
});

describe("CALC_KEYS", () => {
  it("has 20 keys in a 4-column grid with one equals key", () => {
    expect(CALC_KEYS).toHaveLength(20);
    expect(CALC_KEYS.filter((k) => k.kind === "equals")).toHaveLength(1);
  });
});
