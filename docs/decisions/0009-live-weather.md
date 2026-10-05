# 0009: Live Weather app

Status: accepted. Implemented in `src/components/Weather*.jsx`, `src/hooks/useWeather.js`, `src/hooks/useWeatherPrefs.js` and `src/lib/weather/`.

## Decision

- The Weather window shows current conditions, a 24 hour forecast and a 7 day forecast for one city, with a C/F toggle and a city search. Data comes from Open-Meteo (forecast API and geocoding API), fetched from the visitor's browser. No API key, no server of ours.
- The city is chosen by name. The app never asks for geolocation, and `Permissions-Policy` keeps `geolocation=()`.
- The city and unit are kept in `localStorage["fa-www:weather"]`. Nothing else is stored. The default city is Montréal.
- Origins come from `PUBLIC_WEATHER_ORIGIN` and `PUBLIC_GEOCODING_ORIGIN` through `src/lib/config.js`, so a proxy can replace Open-Meteo without a code change.
- The CSP `connect-src` lists both Open-Meteo origins (`docs/caddy/Caddyfile.proposed.md`). `tests/e2e/csp.spec.js` opens Weather under that policy.
- The window shows the credit "Weather data by Open-Meteo.com" (CC BY 4.0).
- Parsing is a pure function (`parseForecast`) that rejects a response without current conditions or times, and tolerates missing optional columns. Errors become `WeatherError` (`network`, `http`, `data`) and `describeError` writes the sentence the visitor sees. A superseded request is aborted, and a late search result never overwrites a newer one.

## Why

Open-Meteo is free for non-commercial use (under 10,000 calls a day), needs no key to leak, and is documented for browser use (inference: CORS is open; confirm in the browser Network tab after the first deploy). A key would have forced a backend or exposed the key.

## Trade-offs

- Each visitor who opens Weather sends their IP address to Open-Meteo, a third party. The site itself sends nothing. The city name is sent to the geocoding API when searching.
- The free tier limits calls per IP, so a visitor behind a busy NAT can see HTTP 429. The app says the service is busy and offers Try again.
- Hourly entries have no day/night flag in the API request, so icons use 06:00 to 20:00 as day (the first entry uses the real `is_day`).

## What would change it

Commercial use of the site (Open-Meteo then requires a paid plan), a rate limit problem, or a wish to avoid the third-party request. Put a caching proxy on your own host and point `PUBLIC_WEATHER_ORIGIN` at it.
