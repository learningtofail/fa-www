import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { inlineHashes } from "../../scripts/lib/csp.mjs";
import { stubOpenMeteo } from "./weatherStubs.js";

const DIST = resolve("dist");
const DOC = readFileSync("docs/caddy/Caddyfile.proposed.md", "utf8");
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".txt": "text/plain",
};

/** The policy as written in the proposed Caddyfile, report-only line first. */
function policyFromDoc() {
  const match = DOC.match(/^\s*Content-Security-Policy-Report-Only "([^"]+)"/m);
  if (!match) throw new Error("docs/caddy/Caddyfile.proposed.md has no Content-Security-Policy-Report-Only line");
  return match[1];
}

test.describe("proposed Content-Security-Policy", () => {
  /** @type {import("node:http").Server} */
  let server;
  let origin = "";
  const policy = policyFromDoc();

  test.beforeAll(async () => {
    server = createServer((req, res) => {
      const path = normalize(decodeURIComponent((req.url ?? "/").split("?")[0])).replace(/^(\.\.[/\\])+/, "");
      let file = join(DIST, path);
      if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
      if (!file.startsWith(DIST) || !existsSync(file)) {
        res.writeHead(404).end();
        return;
      }
      // Served as an enforcing header, even though the host starts in Report-Only.
      res.writeHead(200, {
        "content-type": TYPES[extname(file)] ?? "application/octet-stream",
        "content-security-policy": policy,
      });
      res.end(readFileSync(file));
    });
    await new Promise((done) => server.listen(0, "127.0.0.1", () => done(undefined)));
    origin = `http://127.0.0.1:${/** @type {import("node:net").AddressInfo} */ (server.address()).port}`;
  });

  test.afterAll(() => new Promise((done) => server.close(() => done(undefined))));

  test("the hashes in the doc match the built page", () => {
    const { script, style } = inlineHashes(readFileSync(join(DIST, "index.html"), "utf8"));
    const directive = (name) => policy.match(new RegExp(`${name} ([^;]*)`))?.[1] ?? "";
    for (const source of script) expect(directive("script-src")).toContain(source);
    for (const source of style) expect(directive("style-src")).toContain(source);
    expect(directive("script-src")).not.toContain("unsafe-inline");
    expect(directive("style-src")).not.toContain("unsafe-inline");
  });

  test("the shell, terminal, a tool window, the weather app and the contact form run with no violations", async ({
    page,
  }) => {
    const problems = [];
    await page.addInitScript(() => {
      /** @type {string[]} */
      const seen = [];
      Object.assign(window, { __cspViolations: seen });
      document.addEventListener("securitypolicyviolation", (e) => {
        seen.push(`${e.violatedDirective} ${e.blockedURI}`);
      });
    });
    page.on("console", (msg) => {
      if (/Content Security Policy/i.test(msg.text())) problems.push(msg.text());
    });
    page.on("pageerror", (err) => problems.push(err.message));

    await page.route("https://portfolio.faysalahmed.ca/**", (route) =>
      route.fulfill({ contentType: "text/html", body: "<title>stub</title><p>stub tool</p>" }),
    );
    await page.route("https://contact-api.jrflab.dev/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
    );

    await stubOpenMeteo(page); // the policy applies to the stubbed requests too, so connect-src is exercised

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(origin + "/");
    await expect(page.getByRole("dialog", { name: "about.txt" })).toBeVisible();

    await page.getByPlaceholder("Name").fill("Ada");
    await page.getByPlaceholder("Email").fill("ada@example.com");
    await page.getByPlaceholder("Message").fill("Hello");
    await page.getByRole("button", { name: "Send a message" }).click();
    await expect(page.getByText(/Send failed/)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Send a message" })).toHaveCount(0);

    await page.locator(".gnome-dock").getByRole("button", { name: "Terminal" }).click();
    const input = page.getByRole("textbox", { name: "Terminal command input" });
    await input.fill("help");
    await input.press("Enter");
    await expect(page.getByRole("log", { name: "Terminal output" })).toContainText(/help/i);

    await page.locator(".gnome-dock").getByRole("button", { name: "Tools" }).click();
    await page.getByRole("dialog", { name: "Tools" }).getByRole("button", { name: "UTM Governance Auditor" }).click();
    await expect(page.locator('iframe[title="UTM Governance Auditor"]')).toBeVisible();
    await expect(page.frameLocator('iframe[title="UTM Governance Auditor"]').getByText("stub tool")).toBeVisible();

    await page.locator(".gnome-dock").getByRole("button", { name: "Marketing" }).click();
    await page.getByRole("dialog", { name: "Marketing" }).getByRole("button", { name: "Redirect Mapper" }).click();
    await expect(page.locator('iframe[title="Bulk Redirect Mapper & Loop Validator"]')).toBeVisible();
    await expect(
      page.frameLocator('iframe[title="Bulk Redirect Mapper & Loop Validator"]').getByText("stub tool"),
    ).toBeVisible();

    await page.locator(".gnome-dock").getByRole("button", { name: "Weather" }).click();
    const weather = page.getByRole("dialog", { name: "Weather" });
    await expect(weather.getByText("Partly cloudy")).toBeVisible();
    await weather.getByRole("button", { name: "Change city" }).click();
    await weather.getByRole("searchbox", { name: "City" }).fill("Montreal");
    await weather.getByRole("searchbox", { name: "City" }).press("Enter");
    await expect(weather.getByRole("button", { name: "Montreal, Quebec, Canada" })).toBeVisible();

    problems.push(...(await page.evaluate(() => Reflect.get(window, "__cspViolations") ?? [])));
    expect(problems).toEqual([]);
  });
});
