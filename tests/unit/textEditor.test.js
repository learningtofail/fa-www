import {
  DEFAULT_FILE_NAME,
  DRAFT_KEY,
  EDITOR_ZOOM_STEPS,
  MAX_FILE_BYTES,
  countText,
  cursorPosition,
  isOpenable,
  normalizeFileName,
  readDraft,
  saveDraft,
  stepEditorZoom,
} from "../../src/lib/textEditor.js";

/** A Storage stand-in. `fail` makes every call throw, like blocked storage. */
function fakeStorage({ fail = false } = {}) {
  const data = new Map();
  return {
    data,
    getItem: (key) => {
      if (fail) throw new Error("blocked");
      return data.get(key) ?? null;
    },
    setItem: (key, value) => {
      if (fail) throw new Error("blocked");
      data.set(key, value);
    },
  };
}

describe("cursorPosition", () => {
  it("starts at line 1, column 1", () => {
    expect(cursorPosition("", 0)).toEqual({ line: 1, column: 1 });
    expect(cursorPosition("abc", 0)).toEqual({ line: 1, column: 1 });
  });

  it("counts columns from the last line break", () => {
    expect(cursorPosition("abc", 3)).toEqual({ line: 1, column: 4 });
    expect(cursorPosition("ab\ncd", 3)).toEqual({ line: 2, column: 1 });
    expect(cursorPosition("ab\ncd\n", 6)).toEqual({ line: 3, column: 1 });
    expect(cursorPosition("ab\ncdef", 6)).toEqual({ line: 2, column: 4 });
  });

  it("clamps a negative offset and an offset past the end", () => {
    expect(cursorPosition("ab", -5)).toEqual({ line: 1, column: 1 });
    expect(cursorPosition("ab\ncd", 99)).toEqual({ line: 2, column: 3 });
  });
});

describe("countText", () => {
  it("counts nothing in an empty or blank document", () => {
    expect(countText("")).toEqual({ lines: 0, words: 0, characters: 0 });
    expect(countText("  \n \t ")).toMatchObject({ words: 0 });
  });

  it("counts lines, words and characters", () => {
    expect(countText("one two\nthree")).toEqual({ lines: 2, words: 3, characters: 13 });
    expect(countText("a\n")).toEqual({ lines: 2, words: 1, characters: 2 });
  });

  it("counts an emoji as one character", () => {
    expect(countText("a\u{1F600}b").characters).toBe(3);
  });
});

describe("normalizeFileName", () => {
  it("keeps a good name", () => {
    expect(normalizeFileName("notes.md")).toBe("notes.md");
  });

  it("adds .txt when there is no extension", () => {
    expect(normalizeFileName("notes")).toBe("notes.txt");
  });

  it("falls back to the default for an empty or unusable name", () => {
    expect(normalizeFileName("")).toBe(DEFAULT_FILE_NAME);
    expect(normalizeFileName('  /\\:*?"<>|  ')).toBe(DEFAULT_FILE_NAME);
    expect(normalizeFileName("...")).toBe(DEFAULT_FILE_NAME);
  });

  it("strips path separators, reserved characters, control characters and leading dots", () => {
    expect(normalizeFileName("../etc/passwd")).toBe("etcpasswd.txt");
    expect(normalizeFileName('a<b>:"c"|d?.txt')).toBe("abcd.txt");
    expect(normalizeFileName("a\u0000b\u001f.txt")).toBe("ab.txt");
    expect(normalizeFileName(".hidden.txt")).toBe("hidden.txt");
  });

  it("collapses whitespace", () => {
    expect(normalizeFileName("  my   notes  .txt")).toBe("my notes .txt");
  });

  it("shortens a long name but keeps the extension", () => {
    const name = normalizeFileName(`${"x".repeat(200)}.md`);
    expect(name).toHaveLength(80);
    expect(name.endsWith(".md")).toBe(true);
  });

  it("shortens a long name that has no extension", () => {
    const name = normalizeFileName("y".repeat(200));
    expect(name).toHaveLength(80);
    expect(name.endsWith(".txt")).toBe(true);
  });
});

describe("isOpenable", () => {
  it("allows files up to the limit and refuses larger ones", () => {
    expect(isOpenable(0)).toBe(true);
    expect(isOpenable(MAX_FILE_BYTES)).toBe(true);
    expect(isOpenable(MAX_FILE_BYTES + 1)).toBe(false);
  });
});

describe("stepEditorZoom", () => {
  it("moves one step at a time and stops at both ends", () => {
    expect(stepEditorZoom(100, 1)).toBe(125);
    expect(stepEditorZoom(100, -1)).toBe(75);
    expect(stepEditorZoom(EDITOR_ZOOM_STEPS.at(-1) ?? 0, 1)).toBe(200);
    expect(stepEditorZoom(75, -1)).toBe(75);
  });

  it("treats an unknown value as 100 percent", () => {
    expect(stepEditorZoom(110, 1)).toBe(125);
  });
});

describe("draft storage", () => {
  it("returns an empty document when nothing is saved", () => {
    expect(readDraft(fakeStorage())).toEqual({ name: DEFAULT_FILE_NAME, text: "" });
  });

  it("round-trips a draft", () => {
    const storage = fakeStorage();
    expect(saveDraft(storage, { name: "todo.md", text: "buy milk\n" })).toBe(true);
    expect(readDraft(storage)).toEqual({ name: "todo.md", text: "buy milk\n" });
  });

  it("normalizes a stored name", () => {
    const storage = fakeStorage();
    storage.data.set(DRAFT_KEY, JSON.stringify({ name: "../x", text: "t" }));
    expect(readDraft(storage).name).toBe("x.txt");
  });

  it("ignores values that are not JSON, not an object or have the wrong shape", () => {
    for (const bad of ["{", "null", "42", '{"text":1,"name":"a"}', '{"text":"a"}', '{"name":"a"}']) {
      const storage = fakeStorage();
      storage.data.set(DRAFT_KEY, bad);
      expect(readDraft(storage)).toEqual({ name: DEFAULT_FILE_NAME, text: "" });
    }
  });

  it("ignores a stored draft over the size limit", () => {
    const storage = fakeStorage();
    storage.data.set(DRAFT_KEY, JSON.stringify({ name: "big.txt", text: "x".repeat(MAX_FILE_BYTES + 1) }));
    expect(readDraft(storage).text).toBe("");
  });

  it("survives blocked storage on read and write", () => {
    const storage = fakeStorage({ fail: true });
    expect(readDraft(storage)).toEqual({ name: DEFAULT_FILE_NAME, text: "" });
    expect(saveDraft(storage, { name: "a.txt", text: "a" })).toBe(false);
  });
});
