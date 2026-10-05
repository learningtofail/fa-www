import { useState } from "react";
import "../styles/files.css";
import Icon from "./Icon.jsx";
import { FILE_FOLDERS, FILE_PLACES, FILE_TAB_IDS } from "../data/desktopDemo.js";

/**
 * Files window body. Wide: sidebar plus folder grid. Narrow (a container query, so it works in a
 * small window as well as on a phone): the sidebar becomes a bottom tab bar. Demo content only.
 */
export default function FilesContent() {
  const [placeId, setPlaceId] = useState("home");
  const place = FILE_PLACES.find((p) => p.id === placeId) ?? FILE_PLACES[2];

  const renderPlaces = (places, className, label) => (
    <nav className={className} aria-label={label}>
      {places.map((p) => (
        <button
          key={p.id}
          className="files__place"
          aria-current={p.id === placeId ? "page" : undefined}
          onClick={() => setPlaceId(p.id)}
        >
          <Icon name={p.icon} />
          {p.label}
        </button>
      ))}
    </nav>
  );

  return (
    <div className="files">
      <div className="files__toolbar">
        <span className="files__path">
          <Icon name={place.icon} />
          {place.label}
        </span>
        <Icon name="search" />
      </div>
      <div className="files__body">
        {renderPlaces(FILE_PLACES, "files__sidebar", "Places")}
        <ul className="files__grid" aria-label={`${place.label} folders`}>
          {FILE_FOLDERS.map((name) => (
            <li key={name} className="files__item">
              <span className="files__folder" aria-hidden="true" />
              {name}
            </li>
          ))}
        </ul>
      </div>
      {renderPlaces(
        FILE_PLACES.filter((p) => FILE_TAB_IDS.includes(p.id)),
        "files__tabs",
        "Places",
      )}
    </div>
  );
}
