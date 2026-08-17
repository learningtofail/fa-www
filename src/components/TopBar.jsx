import { useState, useEffect } from "react";

function formatClock(d) {
  const day = d.toLocaleDateString(undefined, { weekday: "short" });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${day} ${time}`;
}

export default function TopBar({ onActivities }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 15);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="gnome-topbar">
      <button className="gnome-activities" onClick={onActivities}>
        Activities
      </button>
      <div className="gnome-clock">{formatClock(now)}</div>
      <div className="gnome-tray">
        <span title="Wi-Fi: connected (metaphorically)">&#x1F4F6;</span>
        <span title="Volume: reasonable">&#x1F50A;</span>
        <span title="Battery: 100% (this is a website)">&#x1F50B;</span>
      </div>
    </div>
  );
}
