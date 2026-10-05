import { FORECAST_FIXTURE, PLACES_FIXTURE } from "../fixtures/openMeteo.js";

/**
 * Answers the two Open-Meteo origins from fixtures so e2e never touches the network.
 * Returns the forecast request URLs seen, in order.
 * @param {import("@playwright/test").Page} page
 * @param {{ forecastStatus?: () => number }} [options] lets a test make the forecast fail
 * @returns {Promise<URL[]>}
 */
export async function stubOpenMeteo(page, { forecastStatus = () => 200 } = {}) {
  const forecastRequests = /** @type {URL[]} */ ([]);
  await page.route("https://api.open-meteo.com/**", (route) => {
    forecastRequests.push(new URL(route.request().url()));
    const status = forecastStatus();
    return route.fulfill({
      status,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify(status === 200 ? FORECAST_FIXTURE : { error: true }),
    });
  });
  await page.route("https://geocoding-api.open-meteo.com/**", (route) =>
    route.fulfill({
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify(PLACES_FIXTURE),
    }),
  );
  return forecastRequests;
}
