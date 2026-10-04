// Vendored Orchis tokens: rebuild (`sync`) or verify (`check`).
//
//   npm run tokens:check                      verify against the pinned DS commit
//   npm run tokens:check -- --require-network fail instead of falling back when GitHub is unreachable (CI)
//   npm run tokens:sync                       rewrite the vendored file from the pinned DS commit
//
// The DS repo has no package.json or tag, so the pin is a commit SHA in orchis.manifest.json.
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildVendoredCss, rawUrl, sha256 } from "./lib/orchis.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const MANIFEST_PATH = resolve(ROOT, "src/styles/orchis.manifest.json");
const FETCH_TIMEOUT_MS = 15_000;

/** @returns {Promise<import("./lib/orchis.mjs").OrchisManifest>} */
async function readManifest() {
  return JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
}

/**
 * @param {import("./lib/orchis.mjs").OrchisManifest} manifest
 * @returns {Promise<string>} the vendored file as rebuilt from GitHub
 */
async function buildFromSource(manifest) {
  const sources = await Promise.all(
    manifest.files.map(async (path) => {
      const response = await fetch(rawUrl(manifest, path), { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
      return { path, text: await response.text() };
    }),
  );
  return buildVendoredCss(manifest, sources);
}

async function check(requireNetwork) {
  const manifest = await readManifest();
  const outputPath = resolve(ROOT, manifest.output);
  const vendored = await readFile(outputPath, "utf8");

  if (sha256(vendored) !== manifest.sha256) {
    process.stderr.write(`tokens:check FAILED: ${manifest.output} does not match the sha256 in the manifest.\n`);
    process.stderr.write("It was edited by hand or the manifest is stale. Run `npm run tokens:sync` to rebuild it.\n");
    return 1;
  }

  let expected;
  try {
    expected = await buildFromSource(manifest);
  } catch (error) {
    if (requireNetwork) {
      process.stderr.write(`tokens:check FAILED: could not fetch the DS files (${error.message}).\n`);
      return 1;
    }
    process.stderr.write(`tokens:check: GitHub unreachable (${error.message}); verified the recorded sha256 only.\n`);
    process.stdout.write("tokens:check OK (offline: sha256 only)\n");
    return 0;
  }

  if (expected !== vendored) {
    process.stderr.write(`tokens:check FAILED: ${manifest.output} differs from ${manifest.source}@${manifest.sha}.\n`);
    process.stderr.write("Run `npm run tokens:sync` and review the diff.\n");
    return 1;
  }
  process.stdout.write(`tokens:check OK (matches ${manifest.source}@${manifest.sha.slice(0, 7)})\n`);
  return 0;
}

async function sync() {
  const manifest = await readManifest();
  const css = await buildFromSource(manifest);
  await writeFile(resolve(ROOT, manifest.output), css);
  await writeFile(MANIFEST_PATH, `${JSON.stringify({ ...manifest, sha256: sha256(css) }, null, 2)}\n`);
  process.stdout.write(`tokens:sync wrote ${manifest.output} from ${manifest.source}@${manifest.sha.slice(0, 7)}\n`);
  return 0;
}

const [command, ...flags] = process.argv.slice(2);
if (command !== "check" && command !== "sync") {
  process.stderr.write("usage: node scripts/tokens.mjs <check [--require-network] | sync>\n");
  process.exit(2);
}
process.exitCode = command === "check" ? await check(flags.includes("--require-network")) : await sync();
