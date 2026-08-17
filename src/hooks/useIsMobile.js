import { useState, useEffect } from "react";

const BREAKPOINT = "(max-width: 768px)";

// Live-tracks the viewport so resizing a desktop browser window across the
// breakpoint actually swaps shells, not just a one-time check on load.
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(BREAKPOINT).matches : false
  );

  useEffect(() => {
    const mql = window.matchMedia(BREAKPOINT);
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
