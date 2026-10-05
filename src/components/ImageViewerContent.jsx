import { useState } from "react";
import "../styles/viewer.css";
import Icon from "./Icon.jsx";
import { VIEWER_IMAGE } from "../data/desktopDemo.js";
import { DEFAULT_ZOOM, ZOOM_STEPS, stepZoom } from "../lib/zoom.js";

/** Image viewer window body: zoom out, zoom in, scrollable stage. */
export default function ImageViewerContent() {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  return (
    <div className="viewer">
      <div className="viewer__bar">
        <button
          className="viewer__btn"
          aria-label="Zoom out"
          disabled={zoom === ZOOM_STEPS[0]}
          onClick={() => setZoom((z) => stepZoom(z, -1))}
        >
          <Icon name="minus" />
        </button>
        <output className="viewer__zoom" aria-live="polite">
          {zoom}%
        </output>
        <button
          className="viewer__btn"
          aria-label="Zoom in"
          disabled={zoom === ZOOM_STEPS[ZOOM_STEPS.length - 1]}
          onClick={() => setZoom((z) => stepZoom(z, 1))}
        >
          <Icon name="plus" />
        </button>
        <span className="viewer__name">{VIEWER_IMAGE.name}</span>
      </div>
      <div
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the zoomed image scrolls, so the stage must be keyboard focusable
        tabIndex={0}
        role="region"
        aria-label="Image"
        className="viewer__stage"
      >
        <img className="viewer__img" data-zoom={zoom} src={VIEWER_IMAGE.src} alt={VIEWER_IMAGE.alt} />
      </div>
    </div>
  );
}
