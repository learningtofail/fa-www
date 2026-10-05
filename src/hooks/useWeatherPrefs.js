import { useCallback, useEffect, useState } from "react";
import { readWeatherPrefs, saveWeatherPrefs } from "../lib/weather/prefs.js";

/** The chosen place and temperature unit, kept in localStorage so the window reopens as it was left. */
export function useWeatherPrefs() {
  const [prefs, setPrefs] = useState(() => readWeatherPrefs(window.localStorage));

  useEffect(() => {
    saveWeatherPrefs(window.localStorage, prefs);
  }, [prefs]);

  const setPlace = useCallback((place) => setPrefs((current) => ({ ...current, place })), []);
  const setUnit = useCallback((unit) => setPrefs((current) => ({ ...current, unit })), []);
  return { place: prefs.place, unit: prefs.unit, setPlace, setUnit };
}
