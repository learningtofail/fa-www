import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

// color-contrast is excluded until Phase 3 fixes the token pairs (review D5); the fixme test below tracks it.
const viewports = { desktop: { width: 1280, height: 800 }, mobile: { width: 390, height: 844 } };

for (const [name, size] of Object.entries(viewports)) {
  test(`${name} shell has no axe violations other than color-contrast`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("/");
    const results = await new AxeBuilder({ page: /** @type {any} */ (page) })
      .disableRules(["color-contrast"])
      .analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
}

test.fixme("desktop shell meets WCAG AA color contrast (D5)", async ({ page }) => {
  await page.setViewportSize(viewports.desktop);
  await page.goto("/");
  const results = await new AxeBuilder({ page: /** @type {any} */ (page) }).withRules(["color-contrast"]).analyze();
  expect(results.violations).toEqual([]);
});
