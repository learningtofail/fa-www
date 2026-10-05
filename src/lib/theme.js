/** Light/dark Orchis variant. The attribute `data-theme` on <html> switches site.light.tokens.css on. */

export const THEMES = ["light", "dark"];
/** Change this one constant to ship dark by default. */
export const DEFAULT_THEME = "light";
export const THEME_KEY = "fa-www:theme";

/**
 * @param {unknown} value
 * @returns {"light" | "dark"} `value` when it is a known theme, otherwise the default
 */
export function resolveTheme(value) {
  return value === "light" || value === "dark" ? value : DEFAULT_THEME;
}

/**
 * @param {Pick<Storage, "getItem">} storage
 * @returns {"light" | "dark"}
 */
export function readTheme(storage) {
  try {
    return resolveTheme(storage.getItem(THEME_KEY));
  } catch {
    return DEFAULT_THEME; // storage blocked (private mode, sandboxed frame)
  }
}

/**
 * @param {Pick<Storage, "setItem">} storage
 * @param {"light" | "dark"} theme
 */
export function saveTheme(storage, theme) {
  try {
    storage.setItem(THEME_KEY, theme);
  } catch {
    // storage blocked: the choice lasts for this page view only
  }
}

/**
 * @param {{ dataset: DOMStringMap }} root usually document.documentElement
 * @param {"light" | "dark"} theme
 */
export function applyTheme(root, theme) {
  root.dataset.theme = theme;
}
