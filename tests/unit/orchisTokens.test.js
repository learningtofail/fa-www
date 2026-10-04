import { buildVendoredCss, rawUrl, sha256 } from "../../scripts/lib/orchis.mjs";

const manifest = {
  source: "owner/ds",
  sha: "abc123",
  files: ["tokens/a.css", "tokens/b.css"],
  output: "out.css",
  sha256: "",
};

describe("orchis token builder", () => {
  it("drops @import lines, keeps declarations, and stamps provenance", () => {
    const css = buildVendoredCss(manifest, [
      { path: "tokens/a.css", text: '@import url("https://fonts.example/x");\n:root { --a: 1; }\n' },
      { path: "tokens/b.css", text: ":root { --b: 2; }\n" },
    ]);
    expect(css).not.toContain("@import url");
    expect(css).toContain(":root { --a: 1; }");
    expect(css).toContain("/* ---- tokens/b.css ---- */");
    expect(css).toContain("owner/ds at commit abc123");
    expect(css.endsWith("\n")).toBe(true);
  });

  it("is deterministic, so check can compare byte for byte", () => {
    const sources = [{ path: "tokens/a.css", text: ":root { --a: 1; }" }];
    expect(buildVendoredCss(manifest, sources)).toBe(buildVendoredCss(manifest, sources));
  });

  it("builds raw URLs at the pinned commit", () => {
    expect(rawUrl(manifest, "tokens/a.css")).toBe("https://raw.githubusercontent.com/owner/ds/abc123/tokens/a.css");
  });

  it("hashes with sha256", () => {
    expect(sha256("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});
