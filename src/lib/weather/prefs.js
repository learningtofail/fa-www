/** @typedef {import("./forecast.js").Place} Place */
/** @typedef {import("./forecast.js").TemperatureUnit} TemperatureUnit */

export const WEATHER_PREFS_KEY = "fa-www:weather";

/** @type {Place} */
export const DEFAULT_PLACE = Object.freeze({
  id: "default",
  name: "Montréal",
  region: "Quebec",
  country: "Canada",
  latitude: 45.5088,
  longitude: -73.5878,
});

/** @typedef {{ place: Place, unit: TemperatureUnit }} WeatherPrefs */

const isCoordinate = (value, limit) => typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= limit;

/**
 * @param {unknown} value
 * @returns {Place | null} a sanitized place, or null when `value` is not a usable place
 */
function cleanPlace(value) {
  const place = /** @type {any} */ (value);
  if (typeof place?.name !== "string" || place.name === "") return null;
  if (!isCoordinate(place.latitude, 90) || !isCoordinate(place.longitude, 180)) return null;
  return {
    id: typeof place.id === "string" ? place.id.slice(0, 40) : "saved",
    name: place.name.slice(0, 80),
    region: typeof place.region === "string" ? place.region.slice(0, 80) : "",
    country: typeof place.country === "string" ? place.country.slice(0, 80) : "",
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

/**
 * @param {Pick<Storage, "getItem">} storage
 * @returns {WeatherPrefs} the saved choices, or the defaults when there are none or they are unreadable
 */
export function readWeatherPrefs(storage) {
  const defaults = { place: DEFAULT_PLACE, unit: /** @type {TemperatureUnit} */ ("celsius") };
  try {
    const parsed = JSON.parse(storage.getItem(WEATHER_PREFS_KEY) ?? "null");
    return {
      place: cleanPlace(parsed?.place) ?? defaults.place,
      unit: parsed?.unit === "fahrenheit" ? "fahrenheit" : "celsius",
    };
  } catch {
    return defaults; // storage blocked or the value is not JSON
  }
}

/**
 * @param {Pick<Storage, "setItem">} storage
 * @param {WeatherPrefs} prefs
 */
export function saveWeatherPrefs(storage, prefs) {
  try {
    storage.setItem(WEATHER_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // storage blocked: the choice lasts for this page view only
  }
}
