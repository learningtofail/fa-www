import { isTextEntryTarget } from "../../src/lib/keyboard.js";

describe("isTextEntryTarget", () => {
  it.each(["input", "textarea", "select"])("is true for <%s>", (tag) => {
    expect(isTextEntryTarget(document.createElement(tag))).toBe(true);
  });

  it("is true for contenteditable elements", () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "isContentEditable", { value: true });
    expect(isTextEntryTarget(el)).toBe(true);
  });

  it("is false for buttons, plain elements and non-elements", () => {
    expect(isTextEntryTarget(document.createElement("button"))).toBe(false);
    expect(isTextEntryTarget(document.createElement("div"))).toBe(false);
    expect(isTextEntryTarget(window)).toBe(false);
    expect(isTextEntryTarget(null)).toBe(false);
  });
});
