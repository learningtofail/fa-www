/**
 * A hand-written Open-Meteo forecast response in the documented shape: local times (timezone=auto), parallel
 * arrays, units objects. Current time is 04:15 on Monday 2026-10-05, so the hourly list starts at 04:00 (hour index 4).
 */
const DAY_CODES = [61, 3, 2, 0, 71, 95, 45];

/** @param {number} hour index into the 7 * 24 hourly arrays */
const hourCode = (hour) => (hour % 24 < 12 ? 3 : 61);

export const FORECAST_FIXTURE = {
  latitude: 45.5,
  longitude: -73.57,
  utc_offset_seconds: -14400,
  timezone: "America/Toronto",
  timezone_abbreviation: "GMT-4",
  current_units: { time: "iso8601", interval: "seconds", temperature_2m: "°C", wind_speed_10m: "km/h" },
  current: {
    time: "2026-10-05T04:15",
    interval: 900,
    temperature_2m: 7.6,
    apparent_temperature: 5.2,
    relative_humidity_2m: 81,
    wind_speed_10m: 14.4,
    weather_code: 2,
    is_day: 0,
  },
  hourly_units: { time: "iso8601", temperature_2m: "°C" },
  hourly: {
    time: Array.from({ length: 7 * 24 }, (_, hour) => {
      const day = String(5 + Math.floor(hour / 24)).padStart(2, "0");
      return `2026-10-${day}T${String(hour % 24).padStart(2, "0")}:00`;
    }),
    temperature_2m: Array.from({ length: 7 * 24 }, (_, hour) => 4 + (hour % 24) / 2),
    weather_code: Array.from({ length: 7 * 24 }, (_, hour) => hourCode(hour)),
    precipitation_probability: Array.from({ length: 7 * 24 }, (_, hour) => (hour % 24) * 3),
  },
  daily_units: { time: "iso8601", temperature_2m_max: "°C" },
  daily: {
    time: ["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11"],
    weather_code: DAY_CODES,
    temperature_2m_max: [12.4, 14.5, 15, 11.2, 3.6, 9.9, 10],
    temperature_2m_min: [5.5, 7.4, 8.1, 4.4, -1.6, 2, 3],
    precipitation_probability_max: [70, 20, 10, 0, 55, 90, 30],
  },
};

/** A geocoding search response for "Montreal", trimmed to the fields the app reads plus a few it ignores. */
export const PLACES_FIXTURE = {
  results: [
    {
      id: 6077243,
      name: "Montreal",
      latitude: 45.50884,
      longitude: -73.58781,
      country: "Canada",
      country_code: "CA",
      admin1: "Quebec",
      timezone: "America/Toronto",
      population: 1762949,
    },
    {
      id: 4568138,
      name: "Montreal",
      latitude: 32.77,
      longitude: -91.19,
      country: "United States",
      admin1: "Mississippi",
    },
  ],
  generationtime_ms: 0.5,
};
