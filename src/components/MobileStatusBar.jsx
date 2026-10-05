import Icon from "./Icon.jsx";

/**
 * The phone's status bar: clock on the left, tray icons on the right. The whole bar is one button
 * that opens the Quick Settings sheet.
 * @param {{ time: string, expanded: boolean, controls: string, onToggle: () => void }} props
 */
export default function MobileStatusBar({ time, expanded, controls, onToggle }) {
  return (
    <button
      className="mobile-status"
      aria-label={`Quick settings, ${time}`}
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onToggle}
    >
      <span className="mobile-status__time">{time}</span>
      <span className="mobile-status__tray">
        <Icon name="ethernet" />
        <Icon name="volume" />
        <Icon name="power" />
      </span>
    </button>
  );
}
