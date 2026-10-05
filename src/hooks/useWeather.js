import { useCallback, useEffect, useState } from "react";
import { config } from "../lib/config.js";
import { describeError } from "../lib/weather/errors.js";
import { fetchForecast } from "../lib/weather/forecast.js";

/**
 * Loads the forecast for `place` in `unit`, and again when either changes or `retry` is called. A request
 * that has been superseded is aborted. The result is tagged with the request it answers, so a stale answer
 * is never shown and loading needs no state of its own.
 * @param {import("../lib/weather/forecast.js").Place} place
 * @param {import("../lib/weather/forecast.js").TemperatureUnit} unit
 * @returns {{
 *   status: "loading" | "ready" | "error",
 *   forecast: import("../lib/weather/forecast.js").Forecast | null,
 *   error: string,
 *   retry: () => void,
 * }}
 */
export function useWeather(place, unit) {
  const [attempt, setAttempt] = useState(0);
  const key = `${place.latitude},${place.longitude},${unit},${attempt}`;
  const [result, setResult] = useState({ key: "", forecast: null, error: "" });

  useEffect(() => {
    const controller = new AbortController();
    fetchForecast(config.weatherOrigin, place, unit, { fetch: window.fetch.bind(window), signal: controller.signal })
      .then((forecast) => setResult({ key, forecast, error: "" }))
      .catch((error) => {
        if (!controller.signal.aborted) setResult({ key, forecast: null, error: describeError(error) });
      });
    return () => controller.abort();
  }, [key, place, unit]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  if (result.key !== key) return { status: "loading", forecast: null, error: "", retry };
  if (result.error) return { status: "error", forecast: null, error: result.error, retry };
  return { status: "ready", forecast: result.forecast, error: "", retry };
}
