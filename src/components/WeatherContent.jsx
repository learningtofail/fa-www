import { useState } from "react";
import "../styles/weather.css";
import Icon from "./Icon.jsx";
import { WEATHER } from "../data/desktopDemo.js";

const TABS = [
  { id: "hourly", label: "Hourly" },
  { id: "daily", label: "Daily" },
];

/** Weather window body: current conditions plus an Hourly / Daily switch. Placeholder data. */
export default function WeatherContent() {
  const [tab, setTab] = useState("hourly");

  return (
    <div className="weather">
      <div className="weather__tabs" role="tablist" aria-label="Forecast range">
        {TABS.map((t) => (
          <button
            key={t.id}
            className="weather__tab"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="weather__now">
        <Icon name="moon" className="weather__moon" />
        <div>
          <p className="weather__city">{WEATHER.city}</p>
          <p className="weather__temp">{WEATHER.temperature}°</p>
        </div>
      </div>
      <div
        className="weather__panel"
        role="tabpanel"
        aria-label={tab === "hourly" ? "Hourly forecast" : "Daily forecast"}
      >
        <ul className="weather__strip">
          {tab === "hourly"
            ? WEATHER.hourly.map((h) => (
                <li key={h.label} className="weather__cell">
                  <span>{h.label}</span>
                  <b>{h.temperature}°</b>
                </li>
              ))
            : WEATHER.daily.map((d) => (
                <li key={d.label} className="weather__cell">
                  <span>{d.label}</span>
                  <b>{d.high}°</b>
                  <span>{d.low}°</span>
                </li>
              ))}
        </ul>
      </div>
    </div>
  );
}
