import Icon from "./Icon.jsx";

/**
 * Current conditions: icon, temperature, summary and the details the service reported.
 * @param {{ current: import("../lib/weather/forecast.js").Forecast["current"] }} props
 */
export default function WeatherNow({ current }) {
  const details = [
    current.feelsLike !== null && `Feels like ${current.feelsLike}°`,
    current.humidity !== null && `Humidity ${current.humidity}%`,
    current.wind !== null && `Wind ${current.wind} ${current.windUnit}`.trim(),
  ].filter(Boolean);

  return (
    <section className="weather__now" aria-label="Current conditions">
      <Icon name={current.icon} className="weather__icon" />
      <div>
        <p className="weather__temp">{current.temperature}°</p>
        <p className="weather__summary">{current.description}</p>
        {details.length > 0 && <p className="weather__details">{details.join(", ")}</p>}
      </div>
    </section>
  );
}
