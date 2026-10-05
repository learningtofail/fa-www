import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

// Axe samples colors at one instant, and buttons fade between states (--transition-chrome). Reduced motion turns the
// fades off, so a slow runner cannot catch a color mid-transition and report a false color-contrast failure.
test.use({ contextOptions: { reducedMotion: "reduce" } });

const viewports = { desktop: { width: 1280, height: 800 }, mobile: { width: 390, height: 844 } };

// All axe rules run, color-contrast included (review D5 fixed the token pairs).
for (const [name, size] of Object.entries(viewports)) {
  test(`${name} shell has no axe violations`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("/");
    const results = await new AxeBuilder({ page: /** @type {any} */ (page) }).analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
}

test("desktop windows with a link, a form and the terminal meet color contrast", async ({ page }) => {
  await page.setViewportSize(viewports.desktop);
  await page.goto("/");
  await page.locator(".gnome-dock").getByRole("button", { name: "Terminal" }).click();
  await page.getByPlaceholder("Name").hover();
  const results = await new AxeBuilder({ page: /** @type {any} */ (page) }).withRules(["color-contrast"]).analyze();
  expect(results.violations).toEqual([]);
});

test("inline style attributes only carry window geometry custom properties", async ({ page }) => {
  await page.setViewportSize(viewports.desktop);
  await page.goto("/");
  await page.locator(".gnome-dock").getByRole("button", { name: "Terminal" }).click();
  const offenders = await page.evaluate(() =>
    [...document.querySelectorAll("[style]")]
      .map((el) => el.getAttribute("style") ?? "")
      .filter((style) => style.split(";").some((decl) => decl.trim() && !decl.trim().startsWith("--window-"))),
  );
  expect(offenders).toEqual([]);
});

test("self-hosted fonts load and no third-party font request is made", async ({ page }) => {
  const external = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1")) external.push(request.url());
  });
  await page.setViewportSize(viewports.desktop);
  await page.goto("/");
  await page.locator(".gnome-dock").getByRole("button", { name: "Terminal" }).click();
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() =>
    [...document.fonts].filter((face) => face.status === "loaded").map((face) => face.family),
  );
  expect(loaded.some((family) => family.includes("Hanken Grotesk"))).toBe(true);
  expect(loaded.some((family) => family.includes("JetBrains Mono"))).toBe(true);
  expect(external.filter((url) => /fonts\.(googleapis|gstatic)\.com/.test(url))).toEqual([]);
});
