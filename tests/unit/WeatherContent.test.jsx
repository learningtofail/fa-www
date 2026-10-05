import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WeatherContent from "../../src/components/WeatherContent.jsx";
import { WEATHER_PREFS_KEY } from "../../src/lib/weather/prefs.js";
import { FORECAST_FIXTURE, PLACES_FIXTURE } from "../fixtures/openMeteo.js";

/**
 * Answers by URL: forecast, geocoding, or a failure the test chooses.
 * @param {{ forecast?: (url: string) => any, search?: (url: string) => any }} [handlers]
 */
function installFetch({ forecast = () => ok(FORECAST_FIXTURE), search = () => ok(PLACES_FIXTURE) } = {}) {
  const calls = /** @type {string[]} */ ([]);
  const fetchFn = vi.fn(async (input) => {
    const url = String(input);
    calls.push(url);
    return url.includes("/v1/search") ? search(url) : forecast(url);
  });
  vi.stubGlobal("fetch", fetchFn);
  return { calls, fetchFn };
}

const ok = (body) => ({ ok: true, status: 200, json: async () => body });
const fail = (status) => ({ ok: false, status, json: async () => ({}) });
const user = () => userEvent.setup();

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe("WeatherContent", () => {
  it("shows loading, then the current conditions and the hourly forecast for the default city", async () => {
    installFetch();
    render(<WeatherContent />);
    expect(screen.getByRole("status").textContent).toContain("Loading");
    expect(await screen.findByText("Partly cloudy")).toBeTruthy();
    expect(screen.queryByText("Loading forecast…")).toBeNull();
    expect(screen.getByText("Montréal, Quebec, Canada")).toBeTruthy();
    const panel = screen.getByRole("tabpanel", { name: "Hourly forecast" });
    expect(within(panel).getAllByRole("listitem")).toHaveLength(24);
    expect(within(panel).getByText("Now")).toBeTruthy();
  });

  it("links to Open-Meteo for attribution", async () => {
    installFetch();
    render(<WeatherContent />);
    const link = screen.getByRole("link", { name: "Weather data by Open-Meteo.com" });
    expect(link.getAttribute("href")).toBe("https://open-meteo.com/");
    expect(link.getAttribute("rel")).toContain("noopener");
    await screen.findByText("Partly cloudy");
  });

  it("switches to the daily forecast", async () => {
    installFetch();
    render(<WeatherContent />);
    await screen.findByText("Partly cloudy");
    await user().click(screen.getByRole("tab", { name: "Daily" }));
    const panel = screen.getByRole("tabpanel", { name: "Daily forecast" });
    expect(within(panel).getAllByRole("listitem")).toHaveLength(7);
    expect(within(panel).getByText("Today")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Daily" }).getAttribute("aria-selected")).toBe("true");
  });

  it("requests Fahrenheit and mph, and remembers the unit", async () => {
    const { calls } = installFetch();
    render(<WeatherContent />);
    await screen.findByText("Partly cloudy");
    await user().click(screen.getByRole("button", { name: "°F" }));
    await waitFor(() => expect(calls.at(-1)).toContain("temperature_unit=fahrenheit"));
    expect(calls.at(-1)).toContain("wind_speed_unit=mph");
    expect(screen.getByRole("button", { name: "°F" }).getAttribute("aria-pressed")).toBe("true");
    expect(JSON.parse(window.localStorage.getItem(WEATHER_PREFS_KEY) ?? "{}").unit).toBe("fahrenheit");
  });

  it("starts from the saved city and unit", async () => {
    window.localStorage.setItem(
      WEATHER_PREFS_KEY,
      JSON.stringify({
        place: { id: "1", name: "Oslo", region: "", country: "Norway", latitude: 59.91, longitude: 10.75 },
        unit: "fahrenheit",
      }),
    );
    const { calls } = installFetch();
    render(<WeatherContent />);
    expect(screen.getByText("Oslo, Norway")).toBeTruthy();
    await screen.findByText("Partly cloudy");
    expect(calls[0]).toContain("latitude=59.9100");
    expect(calls[0]).toContain("temperature_unit=fahrenheit");
  });

  it("finds a city, loads its forecast and saves the choice", async () => {
    const { calls } = installFetch();
    const u = user();
    render(<WeatherContent />);
    await screen.findByText("Partly cloudy");
    await u.click(screen.getByRole("button", { name: "Change city" }));
    expect(document.activeElement).toBe(screen.getByRole("searchbox", { name: "City" }));
    await u.type(screen.getByRole("searchbox", { name: "City" }), "Montreal{Enter}");
    const results = await screen.findAllByRole("button", { name: /Montreal,/ });
    expect(results).toHaveLength(2);
    await u.click(results[1]);
    expect(screen.queryByRole("search")).toBeNull();
    expect(screen.getByText("Montreal, Mississippi, United States")).toBeTruthy();
    await waitFor(() => expect(calls.at(-1)).toContain("latitude=32.7700"));
    expect(JSON.parse(window.localStorage.getItem(WEATHER_PREFS_KEY) ?? "{}").place.name).toBe("Montreal");
  });

  it("asks for at least two letters without calling the service", async () => {
    const { calls } = installFetch();
    const u = user();
    render(<WeatherContent />);
    await screen.findByText("Partly cloudy");
    await u.click(screen.getByRole("button", { name: "Change city" }));
    await u.type(screen.getByRole("searchbox", { name: "City" }), "a{Enter}");
    expect(screen.getByText("Type at least 2 letters.")).toBeTruthy();
    expect(calls.some((url) => url.includes("/v1/search"))).toBe(false);
  });

  it("says when nothing matches", async () => {
    installFetch({ search: () => ok({ generationtime_ms: 1 }) });
    const u = user();
    render(<WeatherContent />);
    await screen.findByText("Partly cloudy");
    await u.click(screen.getByRole("button", { name: "Change city" }));
    await u.type(screen.getByRole("searchbox", { name: "City" }), "Zzzzz{Enter}");
    expect(await screen.findByText("No places found for “Zzzzz”.")).toBeTruthy();
  });

  it("reports a failed search as an alert and closes with Cancel", async () => {
    installFetch({ search: () => fail(500) });
    const u = user();
    render(<WeatherContent />);
    await screen.findByText("Partly cloudy");
    await u.click(screen.getByRole("button", { name: "Change city" }));
    await u.type(screen.getByRole("searchbox", { name: "City" }), "Paris{Enter}");
    expect((await screen.findByRole("alert")).textContent).toContain("status 500");
    await u.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("search")).toBeNull();
  });

  it("toggles the search form from the Change city button", async () => {
    installFetch();
    const u = user();
    render(<WeatherContent />);
    await screen.findByText("Partly cloudy");
    const toggle = screen.getByRole("button", { name: "Change city" });
    await u.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    await u.click(toggle);
    expect(screen.queryByRole("search")).toBeNull();
  });

  it("ignores a search that finishes after a newer one", async () => {
    const pending = /** @type {Array<(value: unknown) => void>} */ ([]);
    installFetch({ search: () => new Promise((resolve) => pending.push(resolve)) });
    const u = user();
    render(<WeatherContent />);
    await screen.findByText("Partly cloudy");
    await u.click(screen.getByRole("button", { name: "Change city" }));
    const field = screen.getByRole("searchbox", { name: "City" });
    await u.type(field, "Oslo{Enter}");
    await u.clear(field);
    await u.type(field, "Rome{Enter}");
    const named = (name) => ({ results: [{ name, latitude: 1, longitude: 2, country: "X" }] });
    pending[1](ok(named("Rome")));
    expect(await screen.findByRole("button", { name: "Rome, X" })).toBeTruthy();
    pending[0](ok(named("Oslo")));
    await Promise.resolve();
    expect(screen.queryByRole("button", { name: "Oslo, X" })).toBeNull();
  });

  it("shows an alert on failure and recovers with Try again", async () => {
    let failing = true;
    installFetch({ forecast: () => (failing ? fail(429) : ok(FORECAST_FIXTURE)) });
    const u = user();
    render(<WeatherContent />);
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("busy");
    failing = false;
    await u.click(within(alert).getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Partly cloudy")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows a network failure as an alert", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))),
    );
    render(<WeatherContent />);
    expect((await screen.findByRole("alert")).textContent).toContain("Could not reach");
  });

  it("does not show a stale forecast while a new city loads", async () => {
    let release = /** @type {(value: unknown) => void} */ (() => {});
    let first = true;
    installFetch({
      forecast: () => {
        if (first) {
          first = false;
          return ok(FORECAST_FIXTURE);
        }
        return new Promise((resolve) => (release = resolve));
      },
    });
    const u = user();
    render(<WeatherContent />);
    await screen.findByText("Partly cloudy");
    await u.click(screen.getByRole("button", { name: "°F" }));
    expect(screen.getByRole("status").textContent).toContain("Loading");
    expect(screen.queryByText("Partly cloudy")).toBeNull();
    release(ok(FORECAST_FIXTURE));
    expect(await screen.findByText("Partly cloudy")).toBeTruthy();
  });
});
