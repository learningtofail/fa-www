import { useState } from "react";
import Icon from "./Icon.jsx";

const TABS = [
  { id: "hourly", label: "Hourly" },
  { id: "daily", label: "Daily" },
];

/** @param {{ percent: number | null }} props */
function Rain({ percent }) {
  return percent === null ? null : <span className="weather__rain">{percent}%</span>;
}

/**
 * Hourly and daily forecast with a tab switch. The panel scrolls sideways when the cells do not fit, so it
 * takes keyboard focus.
 * @param {{ forecast: import("../lib/weather/forecast.js").Forecast }} props
 */
export default function WeatherForecast({ forecast }) {
  const [tab, setTab] = useState("hourly");

  return (
    <>
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
      <div
        className="weather__panel"
        role="tabpanel"
        tabIndex={0}
        aria-label={tab === "hourly" ? "Hourly forecast" : "Daily forecast"}
      >
        <ul className="weather__strip">
          {tab === "hourly"
            ? forecast.hourly.map((h) => (
                <li key={h.id} className="weather__cell">
                  <span>{h.label}</span>
                  <Icon name={h.icon} />
                  <b>{h.temperature === null ? "–" : `${h.temperature}°`}</b>
                  <Rain percent={h.precipitation} />
                  <span className="visually-hidden">{h.description}</span>
                </li>
              ))
            : forecast.daily.map((d) => (
                <li key={d.id} className="weather__cell">
                  <span>{d.label}</span>
                  <Icon name={d.icon} />
                  <b>{d.high === null ? "–" : `${d.high}°`}</b>
                  <span>{d.low === null ? "–" : `${d.low}°`}</span>
                  <Rain percent={d.precipitation} />
                  <span className="visually-hidden">{d.description}</span>
                </li>
              ))}
        </ul>
      </div>
    </>
  );
}
