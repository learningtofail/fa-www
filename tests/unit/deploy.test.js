// @vitest-environment node
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = process.cwd();
const ACTIVATE = resolve(ROOT, "scripts/activate-release.sh");
const DEPLOY = resolve(ROOT, "scripts/deploy.sh");

/** @type {string[]} */
const tempDirs = [];
function tmp() {
  const dir = mkdtempSync(join(tmpdir(), "fa-www-deploy-"));
  tempDirs.push(dir);
  return dir;
}
afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const run = (cmd, args, options = {}) => spawnSync(cmd, args, { encoding: "utf8", ...options });
const activate = (...args) => run("bash", [ACTIVATE, ...args]);

/** Creates BASE/releases/<id>/index.html for each id, oldest first, with increasing mtimes. */
function makeReleases(ids) {
  const base = tmp();
  mkdirSync(join(base, "releases"));
  ids.forEach((id, i) => {
    const dir = join(base, "releases", id);
    mkdirSync(dir);
    writeFileSync(join(dir, "index.html"), `<html>${id}</html>`);
    const when = new Date(Date.now() - (ids.length - i) * 60_000);
    utimesSync(dir, when, when);
  });
  return base;
}

describe("activate-release.sh", () => {
  it("check fails with guidance when releases/ is missing, and when current is a real directory", () => {
    const empty = tmp();
    const missing = activate("check", empty);
    expect(missing.status).toBe(1);
    expect(missing.stderr).toMatch(/host migration/);

    const base = makeReleases(["aaaaaaa"]);
    mkdirSync(join(base, "current"));
    const realDir = activate("check", base);
    expect(realDir.status).toBe(1);
    expect(realDir.stderr).toMatch(/not a symlink/);
  });

  it("check passes on a fresh layout and when current is already a symlink", () => {
    const base = makeReleases(["aaaaaaa"]);
    expect(activate("check", base).status).toBe(0);
    expect(activate("activate", base, "aaaaaaa").status).toBe(0);
    expect(activate("check", base).status).toBe(0);
  });

  it("points current at the release with a relative symlink", () => {
    const base = makeReleases(["aaaaaaa", "bbbbbbb"]);
    expect(activate("activate", base, "bbbbbbb").stdout).toContain("activated bbbbbbb");
    expect(lstatSync(join(base, "current")).isSymbolicLink()).toBe(true);
    expect(readlinkSync(join(base, "current"))).toBe("releases/bbbbbbb");
    expect(readFileSync(join(base, "current", "index.html"), "utf8")).toBe("<html>bbbbbbb</html>");
  });

  it("switches an existing symlink without leaving temp links behind", () => {
    const base = makeReleases(["aaaaaaa", "bbbbbbb"]);
    activate("activate", base, "aaaaaaa");
    activate("activate", base, "bbbbbbb");
    expect(readlinkSync(join(base, "current"))).toBe("releases/bbbbbbb");
    const leftovers = run("bash", ["-c", `ls -A "${base}"`])
      .stdout.split("\n")
      .filter((n) => n.startsWith(".current"));
    expect(leftovers).toEqual([]);
  });

  it("keeps the newest N releases and prunes the rest", () => {
    const ids = ["1111111", "2222222", "3333333", "4444444", "5555555", "6666666", "7777777"];
    const base = makeReleases(ids);
    const result = activate("activate", base, "7777777", "5");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("pruned 1111111");
    expect(result.stdout).toContain("pruned 2222222");
    for (const id of ids.slice(0, 2)) expect(existsSync(join(base, "releases", id))).toBe(false);
    for (const id of ids.slice(2)) expect(existsSync(join(base, "releases", id))).toBe(true);
  });

  it("never prunes the live release, even when it is the oldest", () => {
    const base = makeReleases(["1111111", "2222222", "3333333", "4444444"]);
    // Re-activating the oldest touches it, so it becomes the newest and survives; the others age out.
    activate("activate", base, "1111111", "1");
    expect(existsSync(join(base, "releases", "1111111"))).toBe(true);
    expect(readlinkSync(join(base, "current"))).toBe("releases/1111111");
    expect(existsSync(join(base, "releases", "4444444"))).toBe(false);
  });

  it.each(["../escape", "a/b", "", ".hidden", "x y"])("rejects the release id %j and leaves current alone", (id) => {
    const base = makeReleases(["aaaaaaa"]);
    activate("activate", base, "aaaaaaa");
    const result = activate("activate", base, id);
    expect(result.status).toBe(1);
    expect(readlinkSync(join(base, "current"))).toBe("releases/aaaaaaa");
  });

  it("refuses a release that is missing or has no index.html, and rejects a bad KEEP", () => {
    const base = makeReleases(["aaaaaaa", "bbbbbbb"]);
    activate("activate", base, "aaaaaaa");
    expect(activate("activate", base, "ccccccc").stderr).toMatch(/does not exist/);
    writeFileSync(join(base, "releases", "bbbbbbb", "index.html"), "");
    expect(activate("activate", base, "bbbbbbb").stderr).toMatch(/no index.html/);
    expect(activate("activate", base, "aaaaaaa", "0").stderr).toMatch(/positive integer/);
    expect(readlinkSync(join(base, "current"))).toBe("releases/aaaaaaa");
  });

  it("lists releases newest first and marks the live one", () => {
    const base = makeReleases(["aaaaaaa", "bbbbbbb"]);
    activate("activate", base, "aaaaaaa");
    const lines = activate("list", base).stdout.trim().split("\n");
    expect(lines).toEqual(["* aaaaaaa (live)", "  bbbbbbb"]);
  });

  it("rejects a relative BASE, a missing mode and an unknown mode", () => {
    expect(activate("check", "relative/path").stderr).toMatch(/absolute/);
    expect(run("bash", [ACTIVATE]).status).toBe(1);
    expect(activate("explode", "/tmp").stderr).toMatch(/unknown mode/);
  });
});

describe("deploy.sh", () => {
  /** Builds a sandbox with fake ssh and rsync that log their arguments. */
  function sandbox({ knownHosts = "host ssh-ed25519 AAAA", index = "<html>ok</html>" } = {}) {
    const dir = tmp();
    const bin = join(dir, "bin");
    mkdirSync(bin);
    const log = join(dir, "calls.log");
    writeFileSync(join(bin, "ssh"), `#!/usr/bin/env bash\nprintf 'ssh %s\\n' "$*" >> "${log}"\ncat > /dev/null\n`);
    writeFileSync(join(bin, "rsync"), `#!/usr/bin/env bash\nprintf 'rsync %s\\n' "$*" >> "${log}"\n`);
    chmodSync(join(bin, "ssh"), 0o755);
    chmodSync(join(bin, "rsync"), 0o755);
    mkdirSync(join(dir, "dist"));
    writeFileSync(join(dir, "dist", "index.html"), index);
    writeFileSync(join(dir, "known_hosts"), knownHosts);
    writeFileSync(join(dir, "key"), "key");
    const env = {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      DEPLOY_HOST: "deploy.example.test",
      DEPLOY_USER: "deployer",
      RELEASE_ID: "0123456789abcdef0123456789abcdef01234567",
      SSH_KEY_FILE: join(dir, "key"),
      SSH_KNOWN_HOSTS_FILE: join(dir, "known_hosts"),
      DIST_DIR: join(dir, "dist"),
    };
    return { dir, env, calls: () => (existsSync(log) ? readFileSync(log, "utf8") : "") };
  }

  it("checks the layout, syncs into releases/<sha>, then activates over a host-key-pinned ssh", () => {
    const { env, calls, dir } = sandbox();
    const result = run("bash", [DEPLOY], { env });
    expect(result.status).toBe(0);
    const log = calls();
    expect(log).toContain("StrictHostKeyChecking=yes");
    expect(log).toContain(`UserKnownHostsFile=${dir}/known_hosts`);
    expect(log).not.toContain("StrictHostKeyChecking=no");
    expect(log).toMatch(/ssh .* deployer@deploy.example.test bash -s -- check \/opt\/static-web\/sites\/www/);
    expect(log).toMatch(
      /rsync -az --delete .*dist\/ deployer@deploy.example.test:\/opt\/static-web\/sites\/www\/releases\/0123456789abcdef0123456789abcdef01234567\//,
    );
    expect(log).toMatch(/bash -s -- activate \/opt\/static-web\/sites\/www 0123456789abcdef0123456789abcdef01234567 5/);
    expect(log.indexOf("check")).toBeLessThan(log.indexOf("rsync"));
    expect(log.indexOf("rsync")).toBeLessThan(log.indexOf("activate"));
  });

  it("never rsyncs into the base directory itself, so --delete cannot touch the live site", () => {
    const { env, calls } = sandbox();
    run("bash", [DEPLOY], { env });
    const rsyncLine =
      calls()
        .split("\n")
        .find((l) => l.startsWith("rsync")) ?? "";
    expect(rsyncLine).not.toMatch(/:\/opt\/static-web\/sites\/www\/$/);
    expect(rsyncLine).toContain("/releases/");
  });

  it("dry run checks the layout and previews the sync but does not activate", () => {
    const { env, calls } = sandbox();
    const result = run("bash", [DEPLOY], { env: { ...env, DRY_RUN: "1" } });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("dry run");
    expect(calls()).toContain("--dry-run");
    expect(calls()).not.toContain("activate");
  });

  it("honours DEPLOY_BASE and KEEP_RELEASES", () => {
    const { env, calls } = sandbox();
    run("bash", [DEPLOY], { env: { ...env, DEPLOY_BASE: "/srv/site", KEEP_RELEASES: "3" } });
    expect(calls()).toMatch(/activate \/srv\/site 0123456789abcdef0123456789abcdef01234567 3/);
  });

  it("fails fast, with a clear message and no network call, when the known_hosts file is empty", () => {
    const { env, calls } = sandbox({ knownHosts: "" });
    const result = run("bash", [DEPLOY], { env });
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/SSH_KNOWN_HOSTS secret is empty/);
    expect(calls()).toBe("");
  });

  it("refuses an empty or missing dist/index.html before connecting", () => {
    const empty = sandbox({ index: "" });
    const a = run("bash", [DEPLOY], { env: empty.env });
    expect(a.status).toBe(1);
    expect(a.stderr).toMatch(/index.html is missing or empty/);
    expect(empty.calls()).toBe("");

    const missing = sandbox();
    rmSync(join(missing.dir, "dist", "index.html"));
    expect(run("bash", [DEPLOY], { env: missing.env }).status).toBe(1);
    expect(missing.calls()).toBe("");
  });

  it("rejects a RELEASE_ID that is not a git SHA, and any missing variable", () => {
    const { env, calls } = sandbox();
    const bad = run("bash", [DEPLOY], { env: { ...env, RELEASE_ID: "../../etc" } });
    expect(bad.status).toBe(1);
    expect(bad.stderr).toMatch(/git SHA/);
    const withoutHost = { ...env };
    delete withoutHost.DEPLOY_HOST;
    const missing = run("bash", [DEPLOY], { env: withoutHost });
    expect(missing.status).toBe(1);
    expect(missing.stderr).toMatch(/DEPLOY_HOST is required/);
    expect(calls()).toBe("");
  });

  it("never uses ssh-keyscan", () => {
    expect(readFileSync(DEPLOY, "utf8")).not.toContain("ssh-keyscan");
  });
});
