import { useState } from "react";
import "../styles/weather.css";
import Icon from "./Icon.jsx";
import WeatherForecast from "./WeatherForecast.jsx";
import WeatherNow from "./WeatherNow.jsx";
import WeatherSearch from "./WeatherSearch.jsx";
import { useWeather } from "../hooks/useWeather.js";
import { useWeatherPrefs } from "../hooks/useWeatherPrefs.js";
import { placeLabel } from "../lib/weather/places.js";

const UNITS = [
  { id: "celsius", label: "°C" },
  { id: "fahrenheit", label: "°F" },
];

/** Weather window body: live conditions and forecast for a chosen city (Open-Meteo, fetched in the browser). */
export default function WeatherContent() {
  const { place, unit, setPlace, setUnit } = useWeatherPrefs();
  const weather = useWeather(place, unit);
  const [searching, setSearching] = useState(false);

  return (
    <div className="weather">
      <div className="weather__bar">
        <p className="weather__place">{placeLabel(place)}</p>
        <button className="weather__btn" aria-expanded={searching} onClick={() => setSearching((open) => !open)}>
          <Icon name="search" />
          Change city
        </button>
        <div className="weather__units" role="group" aria-label="Temperature unit">
          {UNITS.map((u) => (
            <button
              key={u.id}
              className="weather__btn weather__btn--unit"
              aria-pressed={unit === u.id}
              onClick={() => setUnit(u.id)}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>
      {searching && (
        <WeatherSearch
          onChoose={(chosen) => {
            setPlace(chosen);
            setSearching(false);
          }}
          onCancel={() => setSearching(false)}
        />
      )}
      {weather.status === "loading" && (
        <p className="weather__message weather__message--fill" role="status">
          Loading forecast…
        </p>
      )}
      {weather.status === "error" && (
        <div className="weather__message weather__message--fill weather__message--error" role="alert">
          <p>{weather.error}</p>
          <button className="weather__btn" onClick={weather.retry}>
            Try again
          </button>
        </div>
      )}
      {weather.forecast && (
        <>
          <WeatherNow current={weather.forecast.current} />
          <WeatherForecast forecast={weather.forecast} />
        </>
      )}
      <p className="weather__credit">
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
          Weather data by Open-Meteo.com
        </a>
      </p>
    </div>
  );
}
