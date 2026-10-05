import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";
import { stubOpenMeteo } from "./weatherStubs.js";

// Axe samples colors at one instant, and buttons fade between states (--transition-chrome). Reduced motion turns the
// fades off, so a slow runner cannot catch a color mid-transition and report a false color-contrast failure.
test.use({ contextOptions: { reducedMotion: "reduce" } });

const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 390, height: 844 };
const THEME_KEY = "fa-www:theme";

/** @param {import("@playwright/test").Page} page */
async function openWeather(page) {
  await page.setViewportSize(DESKTOP);
  await page.goto("/");
  await page.locator(".gnome-dock").getByRole("button", { name: "Weather" }).click();
  const weather = page.getByRole("dialog", { name: "Weather" });
  await expect(weather).toBeVisible();
  return weather;
}

for (const theme of /** @type {const} */ (["light", "dark"])) {
  test(`${theme} theme: the weather app, forecast and search showing, has no axe violations`, async ({ page }) => {
    await stubOpenMeteo(page);
    await page.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [THEME_KEY, theme]);
    const weather = await openWeather(page);
    await expect(weather.getByText("Partly cloudy")).toBeVisible();
    await weather.getByRole("button", { name: "Change city" }).click();
    await weather.getByRole("searchbox", { name: "City" }).fill("Montreal");
    await weather.getByRole("button", { name: "Search", exact: true }).click();
    await expect(weather.getByRole("button", { name: "Montreal, Quebec, Canada" })).toBeVisible();
    const hourly = await new AxeBuilder({ page: /** @type {any} */ (page) }).analyze();
    expect(hourly.violations.map((v) => v.id)).toEqual([]);
    await weather.getByRole("tab", { name: "Daily" }).click();
    const daily = await new AxeBuilder({ page: /** @type {any} */ (page) }).analyze();
    expect(daily.violations.map((v) => v.id)).toEqual([]);
  });

  test(`${theme} theme: the weather error state has no axe violations`, async ({ page }) => {
    await stubOpenMeteo(page, { forecastStatus: () => 500 });
    await page.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [THEME_KEY, theme]);
    const weather = await openWeather(page);
    await expect(weather.getByRole("alert")).toContainText("status 500");
    const results = await new AxeBuilder({ page: /** @type {any} */ (page) }).analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
}

test("the axe specs run with reduced motion, so colors are not sampled mid-transition", async ({ page }) => {
  await page.goto("/");
  expect(await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
});

test("shows current conditions, the hourly strip and the daily forecast", async ({ page }) => {
  await stubOpenMeteo(page);
  const weather = await openWeather(page);
  await expect(weather.getByText("Montréal, Quebec, Canada")).toBeVisible();
  await expect(weather.getByText("Partly cloudy")).toBeVisible();
  await expect(weather.getByRole("tabpanel", { name: "Hourly forecast" }).getByRole("listitem")).toHaveCount(24);
  await weather.getByRole("tab", { name: "Daily" }).click();
  await expect(weather.getByRole("tabpanel", { name: "Daily forecast" }).getByRole("listitem")).toHaveCount(7);
  await expect(weather.getByRole("link", { name: "Weather data by Open-Meteo.com" })).toBeVisible();
});

test("the unit toggle refetches in Fahrenheit and the choice survives a reload", async ({ page }) => {
  const requests = await stubOpenMeteo(page);
  const weather = await openWeather(page);
  await expect(weather.getByText("Partly cloudy")).toBeVisible();
  await weather.getByRole("button", { name: "°F" }).click();
  await expect.poll(() => requests.at(-1)?.searchParams.get("temperature_unit")).toBe("fahrenheit");
  expect(requests.at(-1)?.searchParams.get("wind_speed_unit")).toBe("mph");
  await page.reload();
  await page.locator(".gnome-dock").getByRole("button", { name: "Weather" }).click();
  await expect(page.getByRole("button", { name: "°F" })).toHaveAttribute("aria-pressed", "true");
});

test("choosing another city loads its forecast and is remembered", async ({ page }) => {
  const requests = await stubOpenMeteo(page);
  const weather = await openWeather(page);
  await expect(weather.getByText("Partly cloudy")).toBeVisible();
  await weather.getByRole("button", { name: "Change city" }).click();
  await weather.getByRole("searchbox", { name: "City" }).fill("Montreal");
  await weather.getByRole("searchbox", { name: "City" }).press("Enter");
  await weather.getByRole("button", { name: "Montreal, Mississippi, United States" }).click();
  await expect(weather.getByText("Montreal, Mississippi, United States")).toBeVisible();
  await expect.poll(() => requests.at(-1)?.searchParams.get("latitude")).toBe("32.7700");
  await page.reload();
  await page.locator(".gnome-dock").getByRole("button", { name: "Weather" }).click();
  await expect(page.getByText("Montreal, Mississippi, United States")).toBeVisible();
});

test("a failed forecast shows an alert, and Try again recovers", async ({ page }) => {
  let status = 503;
  await stubOpenMeteo(page, { forecastStatus: () => status });
  const weather = await openWeather(page);
  await expect(weather.getByRole("alert")).toContainText("status 503");
  status = 200;
  await weather.getByRole("button", { name: "Try again" }).click();
  await expect(weather.getByText("Partly cloudy")).toBeVisible();
  await expect(weather.getByRole("alert")).toHaveCount(0);
});

test("the weather app works on the phone shell and has no axe violations", async ({ page }) => {
  await stubOpenMeteo(page);
  await page.setViewportSize(PHONE);
  await page.goto("/");
  await page.locator(".app-grid").getByRole("button", { name: "Weather" }).click();
  await expect(page.getByText("Partly cloudy")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  const results = await new AxeBuilder({ page: /** @type {any} */ (page) }).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});
