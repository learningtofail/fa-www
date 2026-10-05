import { downloadText } from "../../src/lib/fileDownload.js";

function makeDeps({ clickThrows = false } = {}) {
  const link = {
    href: "",
    download: "",
    click: vi.fn(() => {
      if (clickThrows) throw new Error("click failed");
    }),
  };
  return {
    link,
    createObjectURL: vi.fn(/** @type {(blob: Blob) => string} */ (() => "blob:test")),
    revokeObjectURL: vi.fn(),
    createLink: vi.fn(() => link),
  };
}

describe("downloadText", () => {
  it("offers the text as a named text/plain download and releases the object URL", async () => {
    const deps = makeDeps();
    downloadText("notes.txt", "hello", deps);
    const blob = /** @type {Blob} */ (deps.createObjectURL.mock.calls[0][0]);
    expect(blob.type).toBe("text/plain;charset=utf-8");
    expect(await blob.text()).toBe("hello");
    expect(deps.link).toMatchObject({ href: "blob:test", download: "notes.txt" });
    expect(deps.link.click).toHaveBeenCalledOnce();
    expect(deps.revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });

  it("releases the object URL even when the click fails", () => {
    const deps = makeDeps({ clickThrows: true });
    expect(() => downloadText("a.txt", "x", deps)).toThrow("click failed");
    expect(deps.revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });
});
