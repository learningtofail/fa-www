import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

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
