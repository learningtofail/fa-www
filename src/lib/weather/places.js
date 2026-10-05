import { WeatherError } from "./errors.js";

/** @typedef {import("./forecast.js").Place} Place */

export const MAX_QUERY_LENGTH = 80;
export const MIN_QUERY_LENGTH = 2;
const RESULT_COUNT = 5;
const TIMEOUT_MS = 10_000;

/**
 * @param {string} origin e.g. https://geocoding-api.open-meteo.com
 * @param {string} query
 * @returns {string}
 */
export function searchUrl(origin, query) {
  const params = new URLSearchParams({
    name: query.trim().slice(0, MAX_QUERY_LENGTH),
    count: String(RESULT_COUNT),
    language: "en",
    format: "json",
  });
  return `${origin}/v1/search?${params}`;
}

/**
 * Keeps only results with a usable name and coordinates. The service omits `results` when nothing matches.
 * @param {any} json
 * @returns {Place[]}
 */
export function parsePlaces(json) {
  const results = Array.isArray(json?.results) ? json.results : [];
  return results.flatMap((item) => {
    const { latitude, longitude } = item ?? {};
    const valid =
      typeof item?.name === "string" &&
      item.name !== "" &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      Math.abs(latitude) <= 90 &&
      Math.abs(longitude) <= 180;
    if (!valid) return [];
    return [
      {
        id: String(item.id ?? `${latitude},${longitude}`),
        name: item.name,
        region: typeof item.admin1 === "string" ? item.admin1 : "",
        country: typeof item.country === "string" ? item.country : "",
        latitude,
        longitude,
      },
    ];
  });
}

/**
 * @param {Pick<Place, "name" | "region" | "country">} place
 * @returns {string} "Montréal, Quebec, Canada", without repeating a part that equals the name
 */
export function placeLabel(place) {
  const parts = [place.name, place.region, place.country].filter(Boolean);
  return parts.filter((part, i) => parts.indexOf(part) === i).join(", ");
}

/**
 * Looks places up by name. Queries shorter than two characters return nothing without a request.
 * @param {string} origin
 * @param {string} query
 * @param {{ fetch: typeof fetch, signal?: AbortSignal }} deps
 * @returns {Promise<Place[]>}
 */
export async function searchPlaces(origin, query, deps) {
  if (query.trim().length < MIN_QUERY_LENGTH) return [];
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const signal = deps.signal ? AbortSignal.any([deps.signal, timeout]) : timeout;
  let response;
  try {
    response = await deps.fetch(searchUrl(origin, query), { signal });
  } catch (cause) {
    if (deps.signal?.aborted) throw cause;
    throw new WeatherError("network", `place search failed: ${cause instanceof Error ? cause.message : cause}`);
  }
  if (!response.ok) throw new WeatherError("http", `place search returned ${response.status}`, response.status);
  try {
    return parsePlaces(await response.json());
  } catch {
    throw new WeatherError("data", "place search was not JSON");
  }
}
