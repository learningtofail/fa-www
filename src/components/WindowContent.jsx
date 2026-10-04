import AboutContent from "./AboutContent.jsx";
import ContactContent from "./ContactContent.jsx";
import IframeContent from "./IframeContent.jsx";
import NowContent from "./NowContent.jsx";
import Terminal from "./Terminal.jsx";
import ToolsFolderContent from "./ToolsFolderContent.jsx";

/**
 * Chooses the content component for a window.
 * @param {{
 *   win: import("../lib/windowManager.js").WindowState,
 *   lastDeploy: string,
 *   onOpenTool: (slug: string, name: string, url: string) => void,
 * }} props
 */
export default function WindowContent({ win, lastDeploy, onOpenTool }) {
  if (win.isTool) return <IframeContent url={win.url ?? ""} label={win.title} />;
  switch (win.id) {
    case "about":
      return <AboutContent />;
    case "contact":
      return <ContactContent />;
    case "now":
      return <NowContent lastDeploy={lastDeploy} />;
    case "tools":
      return <ToolsFolderContent onOpenTool={onOpenTool} />;
    case "terminal":
      return <Terminal onOpenTool={onOpenTool} />;
    default:
      return null;
  }
}
