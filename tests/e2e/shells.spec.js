import { test, expect } from "@playwright/test";

const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 390, height: 844 };

test.describe("shell selection", () => {
  test("renders the desktop shell above the breakpoint", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/");
    await expect(page.locator(".gnome-dock")).toBeVisible();
    await expect(page.getByRole("dialog", { name: "about.txt" })).toBeVisible();
  });

  test("renders the mobile shell below the breakpoint", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/");
    await expect(page.locator(".gnome-dock")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Terminal" })).toBeVisible();
  });

  test("swaps shells live when the viewport crosses the breakpoint in both directions", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/");
    await expect(page.locator(".gnome-dock")).toBeVisible();
    await page.setViewportSize(MOBILE);
    await expect(page.locator(".gnome-dock")).toHaveCount(0);
    await page.setViewportSize(DESKTOP);
    await expect(page.locator(".gnome-dock")).toBeVisible();
  });
});

test.describe("desktop windows", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/");
  });

  test("closes a window and reopens it from the dock", async ({ page }) => {
    await page.getByRole("button", { name: "Close about.txt" }).click();
    await expect(page.getByRole("dialog", { name: "about.txt" })).toHaveCount(0);
    await page.locator(".gnome-dock").getByRole("button", { name: "About" }).click();
    await expect(page.getByRole("dialog", { name: "about.txt" })).toBeVisible();
  });

  test("opens a desktop icon with the keyboard", async ({ page }) => {
    await page.getByRole("button", { name: "Close about.txt" }).click();
    await page.locator(".desktop-icon", { hasText: "About" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "about.txt" })).toBeVisible();
  });

  test("runs terminal commands end to end", async ({ page }) => {
    await page.locator(".gnome-dock").getByRole("button", { name: "Terminal" }).click();
    const input = page.getByRole("textbox", { name: "Terminal command input" });
    await input.fill("whoami");
    await input.press("Enter");
    await expect(page.getByRole("log", { name: "Terminal output" })).toContainText("convincing impression");
  });

  // Known defect D4: Escape in the terminal input closes the whole window.
  test.fixme("keeps the terminal open when Escape is pressed while typing", async ({ page }) => {
    await page.locator(".gnome-dock").getByRole("button", { name: "Terminal" }).click();
    const input = page.getByRole("textbox", { name: "Terminal command input" });
    await input.press("Escape");
    await expect(input).toBeVisible();
  });
});

test.describe("contact form", () => {
  test("shows an error when the endpoint is unreachable", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.route("https://contact-api.jrflab.dev/**", (route) => route.abort());
    await page.goto("/");
    await page.getByPlaceholder("Name").fill("Ada");
    await page.getByPlaceholder("Email").fill("ada@example.com");
    await page.getByPlaceholder("Message").fill("Hello");
    await page.getByRole("button", { name: "Send a message" }).click();
    await expect(page.getByText(/Send failed/)).toBeVisible();
  });
});

test.describe("mobile tools", () => {
  test("opens a tool full screen inside an iframe", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.route("https://portfolio.faysalahmed.ca/**", (route) =>
      route.fulfill({ contentType: "text/html", body: "<title>stub</title><p>stub tool</p>" }),
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Tools" }).click();
    await page.getByRole("button", { name: "UTM Governance Auditor" }).click();
    await expect(page.locator('iframe[title="UTM Governance Auditor"]')).toBeVisible();
  });
});
