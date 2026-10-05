/** Contact API used when `PUBLIC_CONTACT_ENDPOINT` is not set at build time. */
export const DEFAULT_CONTACT_ENDPOINT = "https://contact-api.jrflab.dev/contact";

/** Origin that serves the tool pages when `PUBLIC_TOOLS_ORIGIN` is not set at build time. */
export const DEFAULT_TOOLS_ORIGIN = "https://portfolio.faysalahmed.ca";

/** Forecast API origin when `PUBLIC_WEATHER_ORIGIN` is not set at build time. */
export const DEFAULT_WEATHER_ORIGIN = "https://api.open-meteo.com";

/** Place-search API origin when `PUBLIC_GEOCODING_ORIGIN` is not set at build time. */
export const DEFAULT_GEOCODING_ORIGIN = "https://geocoding-api.open-meteo.com";

const stripSlashes = (value) => value.replace(/\/+$/, "");

/**
 * Reads build-time configuration. `env` is injected so tests do not need to mutate `import.meta.env`.
 * @param {{
 *   PUBLIC_CONTACT_ENDPOINT?: string,
 *   PUBLIC_TOOLS_ORIGIN?: string,
 *   PUBLIC_WEATHER_ORIGIN?: string,
 *   PUBLIC_GEOCODING_ORIGIN?: string,
 * }} env
 * @returns {{ contactEndpoint: string, toolsOrigin: string, weatherOrigin: string, geocodingOrigin: string }}
 */
export function readConfig(env) {
  return {
    contactEndpoint: env.PUBLIC_CONTACT_ENDPOINT?.trim() || DEFAULT_CONTACT_ENDPOINT,
    toolsOrigin: stripSlashes(env.PUBLIC_TOOLS_ORIGIN?.trim() || DEFAULT_TOOLS_ORIGIN),
    weatherOrigin: stripSlashes(env.PUBLIC_WEATHER_ORIGIN?.trim() || DEFAULT_WEATHER_ORIGIN),
    geocodingOrigin: stripSlashes(env.PUBLIC_GEOCODING_ORIGIN?.trim() || DEFAULT_GEOCODING_ORIGIN),
  };
}

export const config = readConfig(import.meta.env);
