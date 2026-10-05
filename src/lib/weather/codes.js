/**
 * WMO weather interpretation codes as Open-Meteo reports them, mapped to a label and an icon name
 * from data/icons.js. Codes the service does not define fall back to "Unknown".
 * @type {ReadonlyMap<number, { label: string, icon: string }>}
 */
const CODES = new Map([
  [0, { label: "Clear sky", icon: "sun" }],
  [1, { label: "Mainly clear", icon: "sun" }],
  [2, { label: "Partly cloudy", icon: "cloud-sun" }],
  [3, { label: "Overcast", icon: "cloud" }],
  [45, { label: "Fog", icon: "fog" }],
  [48, { label: "Freezing fog", icon: "fog" }],
  [51, { label: "Light drizzle", icon: "rain" }],
  [53, { label: "Drizzle", icon: "rain" }],
  [55, { label: "Heavy drizzle", icon: "rain" }],
  [56, { label: "Light freezing drizzle", icon: "rain" }],
  [57, { label: "Freezing drizzle", icon: "rain" }],
  [61, { label: "Light rain", icon: "rain" }],
  [63, { label: "Rain", icon: "rain" }],
  [65, { label: "Heavy rain", icon: "rain" }],
  [66, { label: "Light freezing rain", icon: "rain" }],
  [67, { label: "Freezing rain", icon: "rain" }],
  [71, { label: "Light snow", icon: "snow" }],
  [73, { label: "Snow", icon: "snow" }],
  [75, { label: "Heavy snow", icon: "snow" }],
  [77, { label: "Snow grains", icon: "snow" }],
  [80, { label: "Light rain showers", icon: "rain" }],
  [81, { label: "Rain showers", icon: "rain" }],
  [82, { label: "Violent rain showers", icon: "rain" }],
  [85, { label: "Light snow showers", icon: "snow" }],
  [86, { label: "Heavy snow showers", icon: "snow" }],
  [95, { label: "Thunderstorm", icon: "storm" }],
  [96, { label: "Thunderstorm with hail", icon: "storm" }],
  [99, { label: "Severe thunderstorm with hail", icon: "storm" }],
]);

const UNKNOWN = { label: "Unknown", icon: "cloud" };

/**
 * @param {unknown} code a WMO weather code
 * @param {boolean} [isDay] at night, clear and partly clear skies get the moon icons
 * @returns {{ label: string, icon: string }}
 */
export function describeWeather(code, isDay = true) {
  const entry = typeof code === "number" ? CODES.get(code) : undefined;
  if (!entry) return UNKNOWN;
  if (isDay) return entry;
  if (entry.icon === "sun") return { ...entry, icon: "moon" };
  if (entry.icon === "cloud-sun") return { ...entry, icon: "cloud-moon" };
  return entry;
}
