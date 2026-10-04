import { CommandHistory } from "../../src/lib/terminal/history.js";

describe("CommandHistory", () => {
  it("returns null when there is nothing to recall", () => {
    const h = new CommandHistory();
    expect(h.previous()).toBeNull();
    expect(h.next()).toBeNull();
  });

  it("walks back, stops at the oldest entry, and walks forward to an empty line", () => {
    const h = new CommandHistory();
    h.push("one");
    h.push("two");
    expect(h.previous()).toBe("two");
    expect(h.previous()).toBe("one");
    expect(h.previous()).toBe("one");
    expect(h.next()).toBe("two");
    expect(h.next()).toBe("");
    expect(h.next()).toBeNull();
  });

  it("ignores blank commands and restarts recall after a push", () => {
    const h = new CommandHistory();
    h.push("one");
    h.push("   ");
    expect(h.previous()).toBe("one");
    h.push("two");
    expect(h.previous()).toBe("two");
  });
});
