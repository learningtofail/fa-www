import { buildFilesystem, listEntries, parseLsArgs, pathLabel, resolvePath } from "../../src/lib/terminal/path.js";

const root = buildFilesystem(
  {
    type: "dir",
    children: {
      "a.txt": { type: "file", content: ["a"] },
      tools: { type: "dir", children: {} },
      ".hid": { type: "dir", children: { "x.txt": { type: "file", content: ["x"] } } },
    },
  },
  [{ slug: "one" }, { slug: "two" }],
);

describe("resolvePath", () => {
  it.each([
    ["tools", [], ["tools"]],
    ["tools/", [], ["tools"]],
    ["./tools//", [], ["tools"]],
    [".hid/x.txt", [], [".hid", "x.txt"]],
    ["..", ["tools"], []],
    ["../..", ["tools"], []],
    ["/tools", ["tools"], ["tools"]],
    ["~/tools", [".hid"], ["tools"]],
    ["one", ["tools"], ["tools", "one"]],
    ["", ["tools"], ["tools"]],
  ])("resolves %j from %j to %j", (input, cwd, expected) => {
    expect(resolvePath(root, cwd, input)?.segments).toEqual(expected);
  });

  it.each(["nope", "a.txt/child", "tools/nope", "constructor", "__proto__", "toString"])(
    "returns null for %j",
    (input) => {
      expect(resolvePath(root, [], input)).toBeNull();
    },
  );
});

describe("buildFilesystem", () => {
  it("fills tools/ with tool nodes without mutating the input", () => {
    expect(resolvePath(root, [], "tools/two")?.node).toEqual({ type: "tool", slug: "two" });
  });
});

describe("listEntries and parseLsArgs", () => {
  it("hides dotfiles unless showAll", () => {
    expect(listEntries(root, false)).toEqual(["a.txt", "tools/"]);
    expect(listEntries(root, true)).toEqual(["a.txt", "tools/", ".hid/"]);
  });

  it("returns nothing for a non-directory", () => {
    expect(listEntries({ type: "file", content: [] }, true)).toEqual([]);
  });

  it("separates flags from operands", () => {
    expect(parseLsArgs(["-la", "tools"])).toEqual({ showAll: true, operands: ["tools"] });
    expect(parseLsArgs(["-l"])).toEqual({ showAll: false, operands: [] });
    expect(parseLsArgs([])).toEqual({ showAll: false, operands: [] });
  });
});

describe("pathLabel", () => {
  it("formats the prompt path", () => {
    expect(pathLabel([])).toBe("~");
    expect(pathLabel(["tools", "x"])).toBe("~/tools/x");
  });
});
