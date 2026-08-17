import { useIsMobile } from "../hooks/useIsMobile.js";
import DesktopShell from "./DesktopShell.jsx";
import MobileShell from "./MobileShell.jsx";

// Two genuinely different experiences, not one layout squished to fit — a GNOME-style
// desktop (top bar, desktop icons, floating draggable windows, dock) and an
// Android-style mobile shell (icon grid, folder pop-up, full-screen app views).
// useIsMobile() tracks the viewport live, so resizing across the breakpoint swaps
// shells rather than just checking once on load.
export default function Desktop({ lastDeploy }) {
  const isMobile = useIsMobile();
  return isMobile ? <MobileShell lastDeploy={lastDeploy} /> : <DesktopShell lastDeploy={lastDeploy} />;
}
