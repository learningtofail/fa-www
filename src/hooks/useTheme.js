import { useCallback, useEffect, useState } from "react";
import { applyTheme, readTheme, resolveTheme, saveTheme } from "../lib/theme.js";

/**
 * Current theme, persisted in localStorage and mirrored to `data-theme` on <html>.
 * Call once, in Desktop.jsx, so both shells are themed.
 */
export function useTheme() {
  const [theme, setThemeState] = useState(() => readTheme(window.localStorage));

  useEffect(() => {
    applyTheme(document.documentElement, theme);
  }, [theme]);

  const setTheme = useCallback((next) => {
    const resolved = resolveTheme(next);
    saveTheme(window.localStorage, resolved);
    setThemeState(resolved);
  }, []);

  return { theme, setTheme };
}
