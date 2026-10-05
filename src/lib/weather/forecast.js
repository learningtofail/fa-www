import { describeWeather } from "./codes.js";
import { WeatherError } from "./errors.js";

/** @typedef {"celsius" | "fahrenheit"} TemperatureUnit */
/** @typedef {{ id: string, name: string, region: string, country: string, latitude: number, longitude: number }} Place */

export const FORECAST_DAYS = 7;
export const HOURS_SHOWN = 24;
const TIMEOUT_MS = 10_000;

const CURRENT_FIELDS = [
  "temperature_2m",
  "apparent_temperature",
  "relative_humidity_2m",
  "wind_speed_10m",
  "weather_code",
  "is_day",
];
const HOURLY_FIELDS = ["temperature_2m", "weather_code", "precipitation_probability"];
const DAILY_FIELDS = ["weather_code", "temperature_2m_max", "temperature_2m_min", "precipitation_probability_max"];

/**
 * @param {string} origin e.g. https://api.open-meteo.com
 * @param {Pick<Place, "latitude" | "longitude">} place
 * @param {TemperatureUnit} unit
 * @returns {string} the forecast request URL
 */
export function forecastUrl(origin, place, unit) {
  const params = new URLSearchParams({
    latitude: place.latitude.toFixed(4),
    longitude: place.longitude.toFixed(4),
    current: CURRENT_FIELDS.join(","),
    hourly: HOURLY_FIELDS.join(","),
    daily: DAILY_FIELDS.join(","),
    timezone: "auto",
    forecast_days: String(FORECAST_DAYS),
    temperature_unit: unit,
    wind_speed_unit: unit === "fahrenheit" ? "mph" : "kmh",
  });
  return `${origin}/v1/forecast?${params}`;
}

const isNumber = (value) => typeof value === "number" && Number.isFinite(value);
const roundOrNull = (value) => (isNumber(value) ? Math.round(value) : null);

/** @param {unknown} column @param {number} length */
function column(column, length) {
  return Array.isArray(column) && column.length === length ? column : new Array(length).fill(null);
}

/**
 * @typedef {{
 *   id: string, label: string, temperature: number | null, code: number | null,
 *   icon: string, description: string, precipitation: number | null,
 * }} HourlyEntry
 * @typedef {{
 *   id: string, label: string, high: number | null, low: number | null, code: number | null,
 *   icon: string, description: string, precipitation: number | null,
 * }} DailyEntry
 * @typedef {{
 *   timezone: string,
 *   current: {
 *     temperature: number, feelsLike: number | null, humidity: number | null, wind: number | null,
 *     windUnit: string, icon: string, description: string,
 *   },
 *   hourly: HourlyEntry[],
 *   daily: DailyEntry[],
 * }} Forecast
 */

/**
 * Turns an Open-Meteo forecast response into what the window shows. Throws `WeatherError("data")` when
 * the response is missing the pieces the app cannot do without (current temperature, hourly and daily times).
 * @param {any} json parsed response body
 * @returns {Forecast}
 */
export function parseForecast(json) {
  const current = json?.current;
  const hourly = json?.hourly;
  const daily = json?.daily;
  if (!isNumber(current?.temperature_2m) || typeof current?.time !== "string") {
    throw new WeatherError("data", "forecast has no current temperature");
  }
  if (!Array.isArray(hourly?.time) || !Array.isArray(daily?.time)) {
    throw new WeatherError("data", "forecast has no hourly or daily times");
  }

  const isDay = current.is_day !== 0;
  const now = describeWeather(current.weather_code, isDay);

  // Open-Meteo returns local times ("2026-10-05T04:15") when timezone=auto, so plain string order is time order.
  const thisHour = `${current.time.slice(0, 13)}:00`;
  const first = Math.max(
    0,
    hourly.time.findIndex((time) => time >= thisHour),
  );
  const hourCount = hourly.time.length;
  const temps = column(hourly.temperature_2m, hourCount);
  const codes = column(hourly.weather_code, hourCount);
  const rain = column(hourly.precipitation_probability, hourCount);
  const hours = hourly.time.slice(first, first + HOURS_SHOWN).map((time, offset) => {
    const i = first + offset;
    // The hourly data has no day/night flag, so outside the current hour use 06:00 to 20:00 as daytime.
    const hourOfDay = Number(time.slice(11, 13));
    const described = describeWeather(codes[i], offset === 0 ? isDay : hourOfDay >= 6 && hourOfDay < 20);
    return {
      id: time,
      label: offset === 0 ? "Now" : time.slice(11, 16),
      temperature: roundOrNull(temps[i]),
      code: isNumber(codes[i]) ? codes[i] : null,
      icon: described.icon,
      description: described.label,
      precipitation: roundOrNull(rain[i]),
    };
  });

  const dayCount = daily.time.length;
  const highs = column(daily.temperature_2m_max, dayCount);
  const lows = column(daily.temperature_2m_min, dayCount);
  const dayCodes = column(daily.weather_code, dayCount);
  const dayRain = column(daily.precipitation_probability_max, dayCount);
  const days = daily.time.map((date, i) => {
    const described = describeWeather(dayCodes[i], true);
    return {
      id: date,
      label: i === 0 ? "Today" : weekday(date),
      high: roundOrNull(highs[i]),
      low: roundOrNull(lows[i]),
      code: isNumber(dayCodes[i]) ? dayCodes[i] : null,
      icon: described.icon,
      description: described.label,
      precipitation: roundOrNull(dayRain[i]),
    };
  });

  return {
    timezone: typeof json.timezone === "string" ? json.timezone : "",
    current: {
      temperature: Math.round(current.temperature_2m),
      feelsLike: roundOrNull(current.apparent_temperature),
      humidity: roundOrNull(current.relative_humidity_2m),
      wind: roundOrNull(current.wind_speed_10m),
      windUnit: typeof json.current_units?.wind_speed_10m === "string" ? json.current_units.wind_speed_10m : "",
      icon: now.icon,
      description: now.label,
    },
    hourly: hours,
    daily: days,
  };
}

/** @param {string} date `YYYY-MM-DD` */
function weekday(date) {
  const parsed = new Date(`${date}T12:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString("en", { weekday: "short", timeZone: "UTC" });
}

/**
 * Fetches and parses a forecast. `fetch` is injected so the call is testable.
 * @param {string} origin
 * @param {Place} place
 * @param {TemperatureUnit} unit
 * @param {{ fetch: typeof fetch, signal?: AbortSignal }} deps
 * @returns {Promise<Forecast>}
 */
export async function fetchForecast(origin, place, unit, deps) {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const signal = deps.signal ? AbortSignal.any([deps.signal, timeout]) : timeout;
  let response;
  try {
    response = await deps.fetch(forecastUrl(origin, place, unit), { signal });
  } catch (cause) {
    if (deps.signal?.aborted) throw cause; // the caller cancelled; it is not an error to show
    throw new WeatherError("network", `forecast request failed: ${cause instanceof Error ? cause.message : cause}`);
  }
  if (!response.ok) throw new WeatherError("http", `forecast returned ${response.status}`, response.status);
  let json;
  try {
    json = await response.json();
  } catch {
    throw new WeatherError("data", "forecast was not JSON");
  }
  return parseForecast(json);
}
