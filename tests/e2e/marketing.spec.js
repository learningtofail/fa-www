import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

// Axe samples colors at one instant, and buttons fade between states (--transition-chrome). Reduced motion turns the
// fades off, so a slow runner cannot catch a color mid-transition and report a false color-contrast failure.
test.use({ contextOptions: { reducedMotion: "reduce" } });

const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 390, height: 844 };
const THEME_KEY = "fa-www:theme";
const STUB_PAGE = "<!doctype html><title>stub</title><h1>stub marketing tool</h1>";

/** Stands in for the portfolio origin, so no test touches the network. */
const stubPortfolio = (page) =>
  page.route("https://portfolio.faysalahmed.ca/**", (route) =>
    route.fulfill({ contentType: "text/html", body: STUB_PAGE }),
  );

for (const theme of /** @type {const} */ (["light", "dark"])) {
  test(`${theme} theme: the Marketing folder and a tool window have no axe violations`, async ({ page }) => {
    await stubPortfolio(page);
    await page.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [THEME_KEY, theme]);
    await page.setViewportSize(DESKTOP);
    await page.goto("/");
    await page.locator(".gnome-dock").getByRole("button", { name: "Marketing" }).click();
    const folder = page.getByRole("dialog", { name: "Marketing" });
    await folder.getByRole("button", { name: "UTM Governance" }).click();
    await expect(page.locator('iframe[title="UTM Governance Auditor"]')).toBeVisible();
    const results = await new AxeBuilder({ page: /** @type {any} */ (page) }).analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
}

test("each tool opens as its own app: window, dock button and frame flags", async ({ page }) => {
  await stubPortfolio(page);
  await page.setViewportSize(DESKTOP);
  await page.goto("/");
  await page.locator(".gnome-dock").getByRole("button", { name: "Marketing" }).click();
  const folder = page.getByRole("dialog", { name: "Marketing" });
  await expect(folder.locator(".tools-grid__tile")).toHaveCount(23);
  await folder.getByRole("button", { name: "Experiment Analyzer" }).click();
  await page.locator(".gnome-dock").getByRole("button", { name: "Marketing" }).click(); // the new window covers the folder
  await folder.getByRole("button", { name: "Redirect Mapper" }).click();
  const experiment = page.locator('iframe[title="A/B, Multivariate & Campaign Experiment Analyzer"]');
  await expect(experiment).toHaveAttribute(
    "src",
    "https://portfolio.faysalahmed.ca/marketing/experiment-analyzer.html",
  );
  await expect(experiment).toHaveAttribute("sandbox", /allow-modals/);
  await expect(page.frameLocator('iframe[title="Bulk Redirect Mapper & Loop Validator"]').locator("h1")).toHaveText(
    "stub marketing tool",
  );
  const dock = page.locator(".gnome-dock");
  await expect(dock.getByRole("button", { name: "Bulk Redirect Mapper & Loop Validator" })).toBeVisible();
  await expect(dock.getByRole("button", { name: "A/B, Multivariate & Campaign Experiment Analyzer" })).toBeVisible();
});

test("the terminal opens the folder and a tool by slug", async ({ page }) => {
  await stubPortfolio(page);
  await page.setViewportSize(DESKTOP);
  await page.goto("/");
  await page.locator(".gnome-dock").getByRole("button", { name: "Terminal" }).click();
  const input = page.getByRole("textbox", { name: "Terminal command input" });
  await input.fill("open marketing");
  await input.press("Enter");
  await expect(page.getByRole("dialog", { name: "Marketing" })).toBeVisible();
  await input.fill("open scv-gap-calculator");
  await input.press("Enter");
  await expect(page.locator('iframe[title="Single Customer View Gap Calculator"]')).toBeVisible();
});

test("the phone shell shows the folder as a popup and opens a tool full screen, with no axe violations", async ({
  page,
}) => {
  await stubPortfolio(page);
  await page.setViewportSize(PHONE);
  await page.goto("/");
  await page.locator(".app-grid").getByRole("button", { name: "Marketing" }).click();
  const popup = page.getByRole("dialog", { name: "Marketing" });
  await expect(popup.locator(".tools-grid__tile")).toHaveCount(23);
  const popupAxe = await new AxeBuilder({ page: /** @type {any} */ (page) }).analyze();
  expect(popupAxe.violations.map((v) => v.id)).toEqual([]);
  await popup.getByRole("button", { name: "Readiness Check" }).click();
  await expect(page.locator('iframe[title="Ad Copy & Landing Page Readiness Checklist"]')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  const results = await new AxeBuilder({ page: /** @type {any} */ (page) }).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});
