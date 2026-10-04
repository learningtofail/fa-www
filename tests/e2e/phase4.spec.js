import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import AxeBuilder from "@axe-core/playwright";

const DESKTOP = { width: 1280, height: 800 };
const TOOL_URL = "https://portfolio.faysalahmed.ca/tools/utm-auditor/";

test.describe("window keyboard policy", () => {
  test("moves a window with the arrow keys and resizes it with Shift plus arrows", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/");
    const win = page.getByRole("dialog", { name: "about.txt" });
    const before = await win.boundingBox();
    await win.getByRole("button", { name: "about.txt", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowDown");
    const moved = await win.boundingBox();
    expect(Math.round(moved.x - before.x)).toBe(32);
    expect(Math.round(moved.y - before.y)).toBe(16);
    await page.keyboard.press("Shift+ArrowRight");
    await page.keyboard.press("Shift+ArrowDown");
    const resized = await win.boundingBox();
    expect(Math.round(resized.width - moved.width)).toBe(16);
    expect(Math.round(resized.height - moved.height)).toBe(16);
  });
});

test.describe("focus handoff", () => {
  test("opens the terminal into its input and returns focus to the dock on close", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/");
    const dock = page.locator(".gnome-dock").getByRole("button", { name: "Terminal" });
    await dock.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("textbox", { name: "Terminal command input" })).toBeFocused();
    await page.getByRole("button", { name: "Close terminal" }).click();
    await expect(dock).toBeFocused();
  });

  test("opens the terminal fully above the dock", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/");
    await page.locator(".gnome-dock").getByRole("button", { name: "Terminal" }).click();
    const win = await page.getByRole("dialog", { name: "terminal" }).boundingBox();
    const dock = await page.locator(".gnome-dock").boundingBox();
    expect(win.y + win.height).toBeLessThanOrEqual(dock.y + 1);
  });
});

test("shows the About and Contact text when JavaScript is off", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Faysal Ahmed" })).toBeVisible();
  await expect(page.getByText(/years making Google behave/)).toBeVisible();
  await expect(page.getByRole("link", { name: "contactfaysal@gmail.com" })).toBeVisible();
  await context.close();
});

// The real tools live on portfolio.faysalahmed.ca, which is not reachable from CI, so a stub page
// stands in for one. It exercises what the tools need: a module script, localStorage, a file
// input and a blob download.
const STUB_HTML = `<!doctype html><meta charset="utf-8"><title>stub tool</title>
<input type="file" id="file" aria-label="Choose file"><button id="dl">Download</button>
<output id="out"></output><output id="module"></output><output id="storage"></output>
<script type="module" src="/tools/utm-auditor/stub.js"></script>`;
const STUB_JS = `
document.getElementById("module").textContent = "module ran";
try { localStorage.setItem("k", "v"); document.getElementById("storage").textContent = "storage ok"; }
catch { document.getElementById("storage").textContent = "storage blocked"; }
document.getElementById("file").addEventListener("change", async (e) => {
  document.getElementById("out").textContent = "read:" + (await e.target.files[0].text());
});
document.getElementById("dl").addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["a,b\\n1,2\\n"], { type: "text/csv" }));
  a.download = "result.csv";
  a.click();
});`;

async function stubPortfolio(page) {
  await page.route("https://portfolio.faysalahmed.ca/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/stub.js")) {
      // No Access-Control-Allow-Origin header, like a plain static host.
      return route.fulfill({ status: 200, contentType: "text/javascript", body: STUB_JS });
    }
    return route.fulfill({ status: 200, contentType: "text/html", body: STUB_HTML });
  });
}

test.describe("tool iframe sandbox flags", () => {
  test("a sandboxed tool can run its module script, use storage, read a file and download", async ({ page }) => {
    await stubPortfolio(page);
    await page.setViewportSize(DESKTOP);
    await page.goto("/");
    await page.locator(".gnome-dock").getByRole("button", { name: "Tools" }).click();
    await page.getByRole("dialog", { name: "Tools" }).getByRole("button", { name: "UTM Governance Auditor" }).click();

    const frameEl = page.locator('iframe[title="UTM Governance Auditor"]');
    await expect(frameEl).toHaveAttribute("sandbox", "allow-scripts allow-same-origin allow-downloads");
    const frame = page.frameLocator('iframe[title="UTM Governance Auditor"]');
    await expect(frame.locator("#module")).toHaveText("module ran");
    await expect(frame.locator("#storage")).toHaveText("storage ok");

    await frame.locator("#file").setInputFiles({ name: "in.csv", mimeType: "text/csv", buffer: Buffer.from("hello") });
    await expect(frame.locator("#out")).toHaveText("read:hello");

    const [download] = await Promise.all([page.waitForEvent("download"), frame.locator("#dl").click()]);
    expect(download.suggestedFilename()).toBe("result.csv");
  });

  test("the new-tab link is always present, so a blocked frame still has a way out", async ({ page }) => {
    await stubPortfolio(page);
    await page.setViewportSize(DESKTOP);
    await page.goto("/");
    await page.locator(".gnome-dock").getByRole("button", { name: "Tools" }).click();
    await page.getByRole("dialog", { name: "Tools" }).getByRole("button", { name: "UTM Governance Auditor" }).click();
    const link = page.getByRole("link", { name: "Open UTM Governance Auditor in a new tab" });
    await expect(link).toHaveAttribute("href", TOOL_URL);
    await expect(link).toHaveAttribute("target", "_blank");
  });

  test("against a real cross-origin server with no CORS headers, the shipped flags work and dropping allow-same-origin breaks module scripts", async ({
    page,
  }) => {
    // route.fulfill adds permissive CORS headers on its own, so this test uses a real server.
    const server = createServer((req, res) => {
      const isScript = req.url?.endsWith("/stub.js");
      res.writeHead(200, { "content-type": isScript ? "text/javascript" : "text/html" });
      res.end(isScript ? STUB_JS : STUB_HTML);
    });
    await new Promise((resolve) => server.listen(0, "localhost", () => resolve(undefined)));
    const { port } = /** @type {import("node:net").AddressInfo} */ (server.address());
    const url = `http://localhost:${port}/tools/utm-auditor/`;
    try {
      await page.goto("/");
      const addFrame = (name, sandbox) =>
        page.evaluate(
          ([frameName, flags, src]) =>
            new Promise((resolve) => {
              const frame = document.createElement("iframe");
              frame.name = frameName;
              frame.setAttribute("sandbox", flags);
              frame.src = src;
              frame.addEventListener("load", () => resolve(undefined));
              document.body.append(frame);
            }),
          [name, sandbox, url],
        );
      await addFrame("shipped", "allow-scripts allow-same-origin allow-downloads");
      await addFrame("stripped", "allow-scripts allow-downloads");

      const shipped = page.frame({ name: "shipped" });
      await expect(shipped.locator("#module")).toHaveText("module ran");
      await expect(shipped.locator("#storage")).toHaveText("storage ok");
      await shipped.locator("#file").setInputFiles({ name: "in.csv", mimeType: "text/csv", buffer: Buffer.from("hi") });
      await expect(shipped.locator("#out")).toHaveText("read:hi");
      const [download] = await Promise.all([page.waitForEvent("download"), shipped.locator("#dl").click()]);
      expect(download.suggestedFilename()).toBe("result.csv");

      // Same page, opaque origin: the module request carries Origin: null and the server sends no CORS headers.
      const stripped = page.frame({ name: "stripped" });
      await page.waitForTimeout(500);
      expect(await stripped.locator("#module").textContent()).toBe("");
    } finally {
      server.close();
    }
  });
});

test("the desktop with a tool window open has no axe violations in the page itself", async ({ page }) => {
  await stubPortfolio(page);
  await page.setViewportSize(DESKTOP);
  await page.goto("/");
  await page.locator(".gnome-dock").getByRole("button", { name: "Tools" }).click();
  await page.getByRole("dialog", { name: "Tools" }).getByRole("button", { name: "UTM Governance Auditor" }).click();
  await expect(page.locator('iframe[title="UTM Governance Auditor"]')).toBeVisible();
  const results = await new AxeBuilder({ page: /** @type {any} */ (page) }).exclude("iframe").analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});
