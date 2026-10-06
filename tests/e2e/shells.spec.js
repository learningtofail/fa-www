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

  // D4: Escape inside a text field must not close the window.
  test("keeps the terminal open when Escape is pressed while typing", async ({ page }) => {
    await page.locator(".gnome-dock").getByRole("button", { name: "Terminal" }).click();
    const input = page.getByRole("textbox", { name: "Terminal command input" });
    await input.press("Escape");
    await expect(input).toBeVisible();
  });

  test("closes the focused window on Escape outside text fields", async ({ page }) => {
    await page.getByRole("button", { name: "Minimize contact.txt" }).focus();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "contact.txt" })).toHaveCount(0);
  });
});

test.describe("window dragging (D7)", () => {
  test("drags by the titlebar and keeps the window inside the viewport", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/");
    const win = page.getByRole("dialog", { name: "about.txt" });
    const bar = win.locator(".win-titlebar");
    const before = await win.boundingBox();
    const grab = await bar.boundingBox();
    const startX = grab.x + 40;
    const startY = grab.y + 10;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 100, startY + 50, { steps: 4 });
    const moved = await win.boundingBox();
    expect(Math.round(moved.x - before.x)).toBe(100);
    expect(Math.round(moved.y - before.y)).toBe(50);
    await page.mouse.move(startX + 5000, startY + 5000, { steps: 4 });
    await page.mouse.up();
    const pinned = await win.boundingBox();
    expect(pinned.x + pinned.width).toBeLessThanOrEqual(DESKTOP.width + 1);
    expect(pinned.y + pinned.height).toBeLessThanOrEqual(DESKTOP.height + 1);
  });

  test("resizes from the corner handle", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/");
    const win = page.getByRole("dialog", { name: "about.txt" });
    const before = await win.boundingBox();
    const handle = await win.locator(".win-resize-handle").boundingBox();
    const hx = handle.x + 8;
    const hy = handle.y + 8;
    await page.mouse.move(hx, hy);
    await page.mouse.down();
    await page.mouse.move(hx + 60, hy + 40, { steps: 4 });
    await page.mouse.up();
    const after = await win.boundingBox();
    expect(Math.round(after.width - before.width)).toBe(60);
    expect(Math.round(after.height - before.height)).toBe(40);
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

test.describe("mobile Marketing folder", () => {
  test("opens a tool full screen inside an iframe", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.route("https://portfolio.faysalahmed.ca/**", (route) =>
      route.fulfill({ contentType: "text/html", body: "<title>stub</title><p>stub tool</p>" }),
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Marketing" }).click();
    await page.getByRole("button", { name: "Multi-Touch" }).click();
    await expect(page.locator('iframe[title="Multi-Touch Attribution"]')).toBeVisible();
  });
});
