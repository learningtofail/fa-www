import { useEffect, useState } from "react";

/**
 * The current time, refreshed on an interval.
 * @param {number} [intervalMs]
 * @returns {Date}
 */
export function useNow(intervalMs = 15000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
