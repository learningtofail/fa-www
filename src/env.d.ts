/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  /** Contact form POST target. Defaults to the production API when unset. */
  readonly PUBLIC_CONTACT_ENDPOINT?: string;
  /** Origin that serves the tool pages. Defaults to the production portfolio origin when unset. */
  readonly PUBLIC_TOOLS_ORIGIN?: string;
  /** Forecast API origin. Defaults to Open-Meteo when unset. */
  readonly PUBLIC_WEATHER_ORIGIN?: string;
  /** Place-search API origin. Defaults to the Open-Meteo geocoding API when unset. */
  readonly PUBLIC_GEOCODING_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
