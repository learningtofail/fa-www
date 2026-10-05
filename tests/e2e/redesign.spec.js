import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 390, height: 844 };
const THEME_KEY = "fa-www:theme";

/** @param {import("@playwright/test").Page} page @param {"light" | "dark"} theme */
async function startWithTheme(page, theme) {
  await page.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [THEME_KEY, theme]);
}

for (const theme of /** @type {const} */ (["light", "dark"])) {
  test(`${theme} theme: the new apps and Quick Settings have no axe violations`, async ({ page }) => {
    await startWithTheme(page, theme);
    await page.setViewportSize(DESKTOP);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const dock = page.locator(".gnome-dock");
    for (const name of ["Files", "Weather", "Calculator", "Image Viewer"]) {
      await dock.getByRole("button", { name }).click();
    }
    await page.getByRole("button", { name: "Quick settings" }).click();
    await expect(page.getByRole("dialog", { name: "Quick settings" })).toBeVisible();
    const results = await new AxeBuilder({ page: /** @type {any} */ (page) }).analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });

  test(`${theme} theme: the phone home, a new app and the sheet have no axe violations`, async ({ page }) => {
    await startWithTheme(page, theme);
    await page.setViewportSize(PHONE);
    await page.goto("/");
    await page.getByRole("button", { name: /^Quick settings/ }).click();
    const sheet = await new AxeBuilder({ page: /** @type {any} */ (page) }).analyze();
    expect(sheet.violations.map((v) => v.id)).toEqual([]);
    await page.keyboard.press("Escape");
    await page.locator(".app-grid").getByRole("button", { name: "Calculator" }).click();
    const app = await new AxeBuilder({ page: /** @type {any} */ (page) }).analyze();
    expect(app.violations.map((v) => v.id)).toEqual([]);
  });
}

test("Dark Style in Quick Settings switches the theme and survives a reload", async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Quick settings" }).click();
  await page.getByRole("button", { name: "Dark Style" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("a window maximizes from its button and from a titlebar double-click, and restores", async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto("/");
  const win = page.getByRole("dialog", { name: "about.txt" });
  const before = await win.boundingBox();
  await page.getByRole("button", { name: "Maximize about.txt" }).click();
  const filled = await win.boundingBox();
  expect(filled?.width ?? 0).toBeGreaterThan((before?.width ?? 0) * 2);
  await page.getByRole("button", { name: "Restore about.txt" }).click();
  expect(await win.boundingBox()).toEqual(before);
  await win.locator(".win-titlebar").dblclick({ position: { x: 300, y: 8 } });
  await expect(page.getByRole("button", { name: "Restore about.txt" })).toBeVisible();
});

test("the calculator follows operator precedence and the terminal opens apps", async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto("/");
  await page.locator(".gnome-dock").getByRole("button", { name: "Calculator" }).click();
  const calc = page.getByRole("dialog", { name: "Calculator" });
  for (const key of ["2", "+", "3", "×", "4", "="]) await calc.getByRole("button", { name: key, exact: true }).click();
  await expect(calc.getByRole("status")).toContainText("14");
  await page.locator(".gnome-dock").getByRole("button", { name: "Terminal" }).click();
  await page.getByRole("textbox", { name: /terminal/i }).fill("open files");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Files" })).toBeVisible();
});
