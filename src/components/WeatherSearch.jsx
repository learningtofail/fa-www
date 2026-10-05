import { useEffect, useId, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import { config } from "../lib/config.js";
import { describeError } from "../lib/weather/errors.js";
import { MIN_QUERY_LENGTH, placeLabel, searchPlaces } from "../lib/weather/places.js";

/**
 * Find a city by name. Results are plain buttons; choosing one calls `onChoose`.
 * @param {{ onChoose: (place: import("../lib/weather/forecast.js").Place) => void, onCancel: () => void }} props
 */
export default function WeatherSearch({ onChoose, onCancel }) {
  const inputId = useId();
  const input = useRef(/** @type {HTMLInputElement | null} */ (null));
  const latest = useRef(0);
  const [query, setQuery] = useState("");
  const [state, setState] = useState({ status: "idle", places: /** @type {any[]} */ ([]), message: "" });

  useEffect(() => input.current?.focus(), []);

  const submit = async (e) => {
    e.preventDefault();
    if (query.trim().length < MIN_QUERY_LENGTH) {
      return setState({ status: "info", places: [], message: `Type at least ${MIN_QUERY_LENGTH} letters.` });
    }
    const request = ++latest.current; // an older search that finishes late must not overwrite a newer one
    setState({ status: "info", places: [], message: "Searching…" });
    try {
      const places = await searchPlaces(config.geocodingOrigin, query, { fetch: window.fetch.bind(window) });
      if (request !== latest.current) return;
      setState({ status: "done", places, message: places.length ? "" : `No places found for “${query.trim()}”.` });
    } catch (error) {
      if (request === latest.current) setState({ status: "error", places: [], message: describeError(error) });
    }
  };

  return (
    <form className="weather__search" role="search" aria-label="Find a city" onSubmit={submit}>
      <label className="weather__label" htmlFor={inputId}>
        City
      </label>
      <div className="weather__search-row">
        <input
          ref={input}
          id={inputId}
          className="weather__input"
          type="search"
          autoComplete="off"
          maxLength={80}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="weather__btn" type="submit">
          <Icon name="search" />
          Search
        </button>
        <button className="weather__btn" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
      {state.message && (
        <p className="weather__message" role={state.status === "error" ? "alert" : "status"}>
          {state.message}
        </p>
      )}
      {state.places.length > 0 && (
        <ul className="weather__results">
          {state.places.map((place) => (
            <li key={place.id}>
              <button className="weather__result" type="button" onClick={() => onChoose(place)}>
                {placeLabel(place)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
