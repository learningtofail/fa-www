import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

// Axe samples colors at one instant, and buttons fade between states (--transition-chrome). Reduced motion turns the
// fades off, so a slow runner cannot catch a color mid-transition and report a false color-contrast failure.
test.use({ contextOptions: { reducedMotion: "reduce" } });

const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 390, height: 844 };
const THEME_KEY = "fa-www:theme";

/** @param {import("@playwright/test").Page} page */
async function openEditor(page) {
  await page.setViewportSize(DESKTOP);
  await page.goto("/");
  await page.locator(".gnome-dock").getByRole("button", { name: "Text Editor" }).click();
  const editor = page.getByRole("dialog", { name: "Text Editor" });
  await expect(editor).toBeVisible();
  return editor;
}

for (const theme of /** @type {const} */ (["light", "dark"])) {
  test(`${theme} theme: the editor, with text and an error showing, has no axe violations`, async ({ page }) => {
    await page.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [THEME_KEY, theme]);
    const editor = await openEditor(page);
    await editor.getByRole("textbox", { name: "Document text" }).fill("Some text\nOn two lines");
    await editor.getByLabel("Choose a text file").setInputFiles({
      name: "huge.txt",
      mimeType: "text/plain",
      buffer: Buffer.alloc(1_000_001, "x"),
    });
    await expect(editor.getByRole("alert")).toHaveText("huge.txt is larger than 1 MB.");
    const results = await new AxeBuilder({ page: /** @type {any} */ (page) }).analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
}

test("typing updates the status bar, and the draft survives a reload", async ({ page }) => {
  const editor = await openEditor(page);
  await editor.getByRole("textbox", { name: "Document text" }).fill("alpha beta\ngamma");
  await expect(editor.getByText("3 words")).toBeVisible();
  await expect(editor.getByText("Unsaved changes")).toBeVisible();
  await page.waitForTimeout(500); // the draft is saved after a short debounce
  await page.reload();
  await page.locator(".gnome-dock").getByRole("button", { name: "Text Editor" }).click();
  await expect(page.getByRole("textbox", { name: "Document text" })).toHaveValue("alpha beta\ngamma");
});

test("Save downloads the text as a named file", async ({ page }) => {
  const editor = await openEditor(page);
  await editor.getByRole("textbox", { name: "Document text" }).fill("saved content");
  await editor.getByRole("textbox", { name: "File name" }).fill("notes");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    editor.getByRole("button", { name: "Save" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("notes.txt");
  const path = await download.path();
  const { readFile } = await import("node:fs/promises");
  expect(await readFile(path, "utf8")).toBe("saved content");
  await expect(editor.getByText("Saved", { exact: true })).toBeVisible();
});

test("Open loads a text file into the editor", async ({ page }) => {
  const editor = await openEditor(page);
  await editor
    .getByLabel("Choose a text file")
    .setInputFiles({ name: "todo.md", mimeType: "text/markdown", buffer: Buffer.from("- one\n- two\n") });
  await expect(editor.getByRole("textbox", { name: "Document text" })).toHaveValue("- one\n- two\n");
  await expect(editor.getByRole("textbox", { name: "File name" })).toHaveValue("todo.md");
});

test("the terminal opens the editor", async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto("/");
  await page.locator(".gnome-dock").getByRole("button", { name: "Terminal" }).click();
  await page.getByRole("textbox", { name: /terminal/i }).fill("open editor");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Text Editor" })).toBeVisible();
});

test("the editor works on the phone shell and has no axe violations", async ({ page }) => {
  await page.setViewportSize(PHONE);
  await page.goto("/");
  await page.locator(".app-grid").getByRole("button", { name: "Text Editor" }).click();
  const box = page.getByRole("textbox", { name: "Document text" });
  await box.fill("on a phone");
  await expect(page.getByText("3 words")).toBeVisible();
  const results = await new AxeBuilder({ page: /** @type {any} */ (page) }).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});
