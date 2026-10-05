export const pad = (n) => String(n).padStart(2, "0");

/**
 * @param {Date} d
 * @returns {string} 24-hour time, for example `09:05`
 */
export const formatTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/**
 * @param {Date} d
 * @returns {string} the long date in the visitor's locale, for example `Monday, October 5`
 */
export const formatDate = (d) => d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
