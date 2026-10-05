import "../styles/icon.css";
import { ICON_PATHS } from "../data/icons.js";

/**
 * Decorative line icon. The parent button carries the accessible name.
 * @param {{ name: keyof typeof ICON_PATHS, className?: string }} props
 */
export default function Icon({ name, className = "" }) {
  return (
    <svg className={`icon ${className}`.trim()} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}
