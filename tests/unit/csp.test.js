// @vitest-environment node
import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { inlineHashes } from "../../scripts/lib/csp.mjs";

const sha = (body) => `'sha256-${createHash("sha256").update(body).digest("base64")}'`;

describe("inlineHashes", () => {
  it("hashes inline script and style bodies exactly as written", () => {
    const html = `<style>a{b:c}</style><script>var x = 1;</script>`;
    expect(inlineHashes(html)).toEqual({ script: [sha("var x = 1;")], style: [sha("a{b:c}")] });
  });

  it("ignores external scripts and empty bodies, and deduplicates", () => {
    const html = `<script src="/a.js"></script><script> </script><script>x</script><script type="module">x</script>`;
    expect(inlineHashes(html)).toEqual({ script: [sha("x")], style: [] });
  });
});
