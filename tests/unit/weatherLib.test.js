import { FORECAST_FIXTURE, PLACES_FIXTURE } from "../fixtures/openMeteo.js";
import { describeWeather } from "../../src/lib/weather/codes.js";
import { WeatherError, describeError } from "../../src/lib/weather/errors.js";
import { HOURS_SHOWN, fetchForecast, forecastUrl, parseForecast } from "../../src/lib/weather/forecast.js";
import { parsePlaces, placeLabel, searchPlaces, searchUrl } from "../../src/lib/weather/places.js";
import { DEFAULT_PLACE, WEATHER_PREFS_KEY, readWeatherPrefs, saveWeatherPrefs } from "../../src/lib/weather/prefs.js";

const clone = (value) => structuredClone(value);
const ORIGIN = "https://api.test";

/** A fetch stand-in that answers with `body` (JSON) and `status`. */
const respond = (body, status = 200) => {
  /** @type {any} */
  const fetchFn = vi.fn(async () => ({ ok: status >= 200 && status < 300, status, json: async () => body }));
  return fetchFn;
};

/** Wraps a fetch implementation so it can stand in for `fetch` and expose `mock.calls`. @param {any} impl @returns {any} */
const stub = (impl) => vi.fn(impl);

function fakeStorage({ fail = false } = {}) {
  const data = new Map();
  return {
    data,
    getItem: (key) => {
      if (fail) throw new Error("blocked");
      return data.get(key) ?? null;
    },
    setItem: (key, value) => {
      if (fail) throw new Error("blocked");
      data.set(key, value);
    },
  };
}

describe("describeWeather", () => {
  it("names the documented WMO codes", () => {
    expect(describeWeather(0)).toEqual({ label: "Clear sky", icon: "sun" });
    expect(describeWeather(63)).toEqual({ label: "Rain", icon: "rain" });
    expect(describeWeather(75)).toEqual({ label: "Heavy snow", icon: "snow" });
    expect(describeWeather(95)).toEqual({ label: "Thunderstorm", icon: "storm" });
    expect(describeWeather(45)).toEqual({ label: "Fog", icon: "fog" });
  });

  it("uses the moon icons at night for clear and partly clear skies only", () => {
    expect(describeWeather(0, false).icon).toBe("moon");
    expect(describeWeather(2, false).icon).toBe("cloud-moon");
    expect(describeWeather(3, false).icon).toBe("cloud");
    expect(describeWeather(63, false).icon).toBe("rain");
  });

  it("falls back to Unknown for codes it does not know and for non-numbers", () => {
    for (const code of [4, 100, -1, null, undefined, "0"]) {
      expect(describeWeather(code)).toEqual({ label: "Unknown", icon: "cloud" });
    }
  });
});

describe("forecastUrl", () => {
  it("asks for the documented fields, local time and 7 days", () => {
    const url = new URL(forecastUrl(ORIGIN, { latitude: 45.50884, longitude: -73.58781 }, "celsius"));
    expect(url.origin + url.pathname).toBe("https://api.test/v1/forecast");
    expect(url.searchParams.get("latitude")).toBe("45.5088");
    expect(url.searchParams.get("longitude")).toBe("-73.5878");
    expect(url.searchParams.get("current")).toBe(
      "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day",
    );
    expect(url.searchParams.get("hourly")).toBe("temperature_2m,weather_code,precipitation_probability");
    expect(url.searchParams.get("daily")).toBe(
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    );
    expect(url.searchParams.get("timezone")).toBe("auto");
    expect(url.searchParams.get("forecast_days")).toBe("7");
  });

  it("pairs Celsius with km/h and Fahrenheit with mph", () => {
    const celsius = new URL(forecastUrl(ORIGIN, { latitude: 0, longitude: 0 }, "celsius")).searchParams;
    expect([celsius.get("temperature_unit"), celsius.get("wind_speed_unit")]).toEqual(["celsius", "kmh"]);
    const fahrenheit = new URL(forecastUrl(ORIGIN, { latitude: 0, longitude: 0 }, "fahrenheit")).searchParams;
    expect([fahrenheit.get("temperature_unit"), fahrenheit.get("wind_speed_unit")]).toEqual(["fahrenheit", "mph"]);
  });
});

describe("parseForecast", () => {
  const forecast = parseForecast(FORECAST_FIXTURE);

  it("rounds the current conditions and names them for the night", () => {
    expect(forecast.current).toEqual({
      temperature: 8,
      feelsLike: 5,
      humidity: 81,
      wind: 14,
      windUnit: "km/h",
      icon: "cloud-moon",
      description: "Partly cloudy",
    });
    expect(forecast.timezone).toBe("America/Toronto");
  });

  it("starts the hourly list at the current hour, labelled Now, and shows 24 hours", () => {
    expect(forecast.hourly).toHaveLength(HOURS_SHOWN);
    expect(forecast.hourly[0]).toMatchObject({ id: "2026-10-05T04:00", label: "Now", temperature: 6 });
    expect(forecast.hourly[1]).toMatchObject({ label: "05:00" });
    expect(forecast.hourly.at(-1)).toMatchObject({ id: "2026-10-06T03:00", label: "03:00" });
  });

  it("carries icon, description and rain chance per hour, with night icons outside 06:00 to 20:00", () => {
    expect(forecast.hourly[0]).toMatchObject({ icon: "cloud", description: "Overcast", precipitation: 12 });
    const at = (label) => forecast.hourly.find((h) => h.label === label);
    expect(at("13:00")).toMatchObject({ icon: "rain", description: "Light rain" });
  });

  it("labels the first day Today and the rest by weekday", () => {
    expect(forecast.daily.map((d) => d.label)).toEqual(["Today", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    expect(forecast.daily[0]).toEqual({
      id: "2026-10-05",
      label: "Today",
      high: 12,
      low: 6,
      code: 61,
      icon: "rain",
      description: "Light rain",
      precipitation: 70,
    });
    expect(forecast.daily[4]).toMatchObject({ high: 4, low: -2, icon: "snow" });
  });

  it("uses the current is_day flag for the Now cell", () => {
    const day = clone(FORECAST_FIXTURE);
    day.current.is_day = 1;
    day.current.weather_code = 0;
    day.hourly.weather_code[4] = 0;
    expect(parseForecast(day).hourly[0].icon).toBe("sun");
    expect(parseForecast(day).current.icon).toBe("sun");
  });

  it("starts at the first hour when the current time is before every hourly time", () => {
    const early = clone(FORECAST_FIXTURE);
    early.current.time = "2026-10-04T23:30";
    expect(parseForecast(early).hourly[0].id).toBe("2026-10-05T00:00");
  });

  it("starts at the first hour when the current time is after every hourly time", () => {
    const late = clone(FORECAST_FIXTURE);
    late.current.time = "2026-12-01T10:00";
    expect(parseForecast(late).hourly[0].id).toBe("2026-10-05T00:00");
  });

  it("tolerates missing optional fields and misaligned columns", () => {
    const sparse = clone(FORECAST_FIXTURE);
    delete sparse.current.apparent_temperature;
    delete sparse.current.relative_humidity_2m;
    delete sparse.current.wind_speed_10m;
    delete sparse.current_units;
    delete sparse.timezone;
    delete sparse.hourly.precipitation_probability;
    sparse.hourly.temperature_2m = [1, 2];
    delete sparse.daily.weather_code;
    const parsed = parseForecast(sparse);
    expect(parsed.current).toMatchObject({ feelsLike: null, humidity: null, wind: null, windUnit: "" });
    expect(parsed.timezone).toBe("");
    expect(parsed.hourly[0]).toMatchObject({ temperature: null, precipitation: null });
    expect(parsed.daily[0]).toMatchObject({ code: null, icon: "cloud", description: "Unknown" });
  });

  it("falls back to the raw string for a day it cannot parse", () => {
    const odd = clone(FORECAST_FIXTURE);
    odd.daily.time[1] = "not-a-date";
    expect(parseForecast(odd).daily[1].label).toBe("not-a-date");
  });

  it.each([
    ["null", null],
    ["no current block", { hourly: FORECAST_FIXTURE.hourly, daily: FORECAST_FIXTURE.daily }],
    ["a non-numeric current temperature", { ...FORECAST_FIXTURE, current: { time: "x", temperature_2m: "warm" } }],
    ["no current time", { ...FORECAST_FIXTURE, current: { temperature_2m: 5 } }],
    ["no hourly times", { ...FORECAST_FIXTURE, hourly: {} }],
    ["no daily times", { ...FORECAST_FIXTURE, daily: {} }],
  ])("rejects a response with %s", (_label, body) => {
    expect(() => parseForecast(body)).toThrow(WeatherError);
    expect(() => parseForecast(body)).toThrow(/forecast has no/);
  });
});

describe("fetchForecast", () => {
  const place = { id: "x", name: "A", region: "", country: "", latitude: 1, longitude: 2 };

  it("requests the forecast URL and returns the parsed forecast", async () => {
    const fetchFn = respond(FORECAST_FIXTURE);
    const result = await fetchForecast(ORIGIN, place, "celsius", { fetch: fetchFn });
    expect(fetchFn).toHaveBeenCalledOnce();
    expect(fetchFn.mock.calls[0][0]).toBe(forecastUrl(ORIGIN, place, "celsius"));
    expect(result.current.temperature).toBe(8);
  });

  it("passes the caller's abort signal through, combined with a timeout", async () => {
    const controller = new AbortController();
    const fetchFn = respond(FORECAST_FIXTURE);
    await fetchForecast(ORIGIN, place, "celsius", { fetch: fetchFn, signal: controller.signal });
    const { signal } = fetchFn.mock.calls[0][1];
    expect(signal.aborted).toBe(false);
    controller.abort();
    expect(signal.aborted).toBe(true);
  });

  it.each([
    [429, /status/],
    [500, /500/],
  ])("turns HTTP %i into an http error that keeps the status", async (status) => {
    const error = await fetchForecast(ORIGIN, place, "celsius", { fetch: respond({}, status) }).catch((e) => e);
    expect(error).toBeInstanceOf(WeatherError);
    expect(error).toMatchObject({ kind: "http", status });
  });

  it("turns a failed request into a network error", async () => {
    const fetchFn = stub(async () => {
      throw new TypeError("Failed to fetch");
    });
    const error = await fetchForecast(ORIGIN, place, "celsius", { fetch: fetchFn }).catch((e) => e);
    expect(error).toMatchObject({ kind: "network" });
    expect(error.message).toContain("Failed to fetch");
  });

  it("describes a non-Error rejection too", async () => {
    const error = await fetchForecast(ORIGIN, place, "celsius", {
      fetch: stub(() => Promise.reject("offline")),
    }).catch((e) => e);
    expect(error.message).toContain("offline");
  });

  it("rethrows the original error when the caller cancelled", async () => {
    const controller = new AbortController();
    controller.abort();
    const abort = new DOMException("aborted", "AbortError");
    const error = await fetchForecast(ORIGIN, place, "celsius", {
      fetch: stub(() => Promise.reject(abort)),
      signal: controller.signal,
    }).catch((e) => e);
    expect(error).toBe(abort);
  });

  it("turns a body that is not JSON into a data error", async () => {
    const fetchFn = stub(async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("bad json");
      },
    }));
    expect(await fetchForecast(ORIGIN, place, "celsius", { fetch: fetchFn }).catch((e) => e)).toMatchObject({
      kind: "data",
    });
  });

  it("turns an unusable body into a data error", async () => {
    expect(await fetchForecast(ORIGIN, place, "celsius", { fetch: respond({}) }).catch((e) => e)).toMatchObject({
      kind: "data",
    });
  });
});

describe("describeError", () => {
  it("writes a sentence per kind", () => {
    expect(describeError(new WeatherError("network", "x"))).toMatch(/Could not reach/);
    expect(describeError(new WeatherError("data", "x"))).toMatch(/could not read/);
    expect(describeError(new WeatherError("http", "x", 429))).toMatch(/busy/);
    expect(describeError(new WeatherError("http", "x", 503))).toMatch(/status 503/);
    expect(describeError(new Error("other"))).toBe("Something went wrong. Try again.");
  });
});

describe("places", () => {
  it("builds a search URL with a trimmed, length-limited name", () => {
    const url = new URL(searchUrl("https://geo.test", `  ${"x".repeat(200)}  `));
    expect(url.origin + url.pathname).toBe("https://geo.test/v1/search");
    expect(url.searchParams.get("name")).toBe("x".repeat(80));
    expect(url.searchParams.get("count")).toBe("5");
    expect(url.searchParams.get("language")).toBe("en");
    expect(url.searchParams.get("format")).toBe("json");
  });

  it("parses results into places", () => {
    expect(parsePlaces(PLACES_FIXTURE)[0]).toEqual({
      id: "6077243",
      name: "Montreal",
      region: "Quebec",
      country: "Canada",
      latitude: 45.50884,
      longitude: -73.58781,
    });
    expect(parsePlaces(PLACES_FIXTURE)).toHaveLength(2);
  });

  it("returns nothing when the service omits results", () => {
    expect(parsePlaces({ generationtime_ms: 1 })).toEqual([]);
    expect(parsePlaces(null)).toEqual([]);
    expect(parsePlaces({ results: "nope" })).toEqual([]);
  });

  it("drops results without a usable name or coordinates, and fills missing parts", () => {
    const places = parsePlaces({
      results: [
        null,
        { name: "", latitude: 1, longitude: 1 },
        { name: "NoLat", longitude: 1 },
        { name: "Far", latitude: 91, longitude: 0 },
        { name: "Wide", latitude: 0, longitude: 181 },
        { name: "NaN", latitude: Number.NaN, longitude: 0 },
        { name: "Bare", latitude: 10, longitude: 20 },
      ],
    });
    expect(places).toEqual([{ id: "10,20", name: "Bare", region: "", country: "", latitude: 10, longitude: 20 }]);
  });

  it("labels a place without repeating parts", () => {
    expect(placeLabel({ name: "Montreal", region: "Quebec", country: "Canada" })).toBe("Montreal, Quebec, Canada");
    expect(placeLabel({ name: "Singapore", region: "", country: "Singapore" })).toBe("Singapore");
    expect(placeLabel({ name: "Paris", region: "", country: "" })).toBe("Paris");
  });

  it("makes no request for a query under two characters", async () => {
    const fetchFn = respond(PLACES_FIXTURE);
    expect(await searchPlaces("https://geo.test", " a ", { fetch: fetchFn })).toEqual([]);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("searches and parses", async () => {
    const fetchFn = respond(PLACES_FIXTURE);
    const places = await searchPlaces("https://geo.test", "Montreal", { fetch: fetchFn });
    expect(places).toHaveLength(2);
    expect(fetchFn.mock.calls[0][0]).toBe(searchUrl("https://geo.test", "Montreal"));
  });

  it("maps failures the same way as the forecast", async () => {
    const deps = (fetchFn, signal) => ({ fetch: fetchFn, signal });
    const http = await searchPlaces("https://geo.test", "ab", deps(respond({}, 500))).catch((e) => e);
    expect(http).toMatchObject({ kind: "http", status: 500 });
    const network = await searchPlaces(
      "https://geo.test",
      "ab",
      deps(stub(() => Promise.reject(new TypeError("down")))),
    ).catch((e) => e);
    expect(network).toMatchObject({ kind: "network" });
    const nonError = await searchPlaces("https://geo.test", "ab", deps(stub(() => Promise.reject("x")))).catch(
      (e) => e,
    );
    expect(nonError.message).toContain("x");
    const badJson = await searchPlaces(
      "https://geo.test",
      "ab",
      deps(
        stub(async () => ({
          ok: true,
          json: async () => {
            throw new SyntaxError("bad");
          },
        })),
      ),
    ).catch((e) => e);
    expect(badJson).toMatchObject({ kind: "data" });
  });

  it("rethrows the original error when the caller cancelled", async () => {
    const controller = new AbortController();
    controller.abort();
    const abort = new DOMException("aborted", "AbortError");
    const error = await searchPlaces("https://geo.test", "ab", {
      fetch: stub(() => Promise.reject(abort)),
      signal: controller.signal,
    }).catch((e) => e);
    expect(error).toBe(abort);
  });

  it("passes the caller's signal through with a timeout", async () => {
    const controller = new AbortController();
    const fetchFn = respond(PLACES_FIXTURE);
    await searchPlaces("https://geo.test", "ab", { fetch: fetchFn, signal: controller.signal });
    controller.abort();
    expect(fetchFn.mock.calls[0][1].signal.aborted).toBe(true);
  });
});

describe("weather prefs", () => {
  it("defaults to the default place in Celsius", () => {
    expect(readWeatherPrefs(fakeStorage())).toEqual({ place: DEFAULT_PLACE, unit: "celsius" });
  });

  it("round-trips a place and a unit", () => {
    const storage = fakeStorage();
    const place = { id: "1", name: "Oslo", region: "", country: "Norway", latitude: 59.9, longitude: 10.7 };
    saveWeatherPrefs(storage, { place, unit: "fahrenheit" });
    expect(readWeatherPrefs(storage)).toEqual({ place, unit: "fahrenheit" });
  });

  it("sanitizes a stored place: trims lengths, fills missing parts", () => {
    const storage = fakeStorage();
    storage.data.set(
      WEATHER_PREFS_KEY,
      JSON.stringify({ place: { name: "N".repeat(200), latitude: 1, longitude: 2 }, unit: "kelvin" }),
    );
    const { place, unit } = readWeatherPrefs(storage);
    expect(place.name).toHaveLength(80);
    expect(place).toMatchObject({ id: "saved", region: "", country: "" });
    expect(unit).toBe("celsius");
  });

  it("falls back to the default place for anything unusable", () => {
    for (const bad of [
      "{",
      "null",
      "42",
      JSON.stringify({ place: { name: "", latitude: 1, longitude: 1 } }),
      JSON.stringify({ place: { name: "X", latitude: "1", longitude: 1 } }),
      JSON.stringify({ place: { name: "X", latitude: 99, longitude: 1 } }),
      JSON.stringify({ place: { name: "X", latitude: 1, longitude: 200 } }),
    ]) {
      const storage = fakeStorage();
      storage.data.set(WEATHER_PREFS_KEY, bad);
      expect(readWeatherPrefs(storage).place).toEqual(DEFAULT_PLACE);
    }
  });

  it("survives blocked storage on read and write", () => {
    const storage = fakeStorage({ fail: true });
    expect(readWeatherPrefs(storage)).toEqual({ place: DEFAULT_PLACE, unit: "celsius" });
    expect(() => saveWeatherPrefs(storage, { place: DEFAULT_PLACE, unit: "celsius" })).not.toThrow();
  });
});
