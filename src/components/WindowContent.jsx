import AboutContent from "./AboutContent.jsx";
import CalculatorContent from "./CalculatorContent.jsx";
import ContactContent from "./ContactContent.jsx";
import FilesContent from "./FilesContent.jsx";
import IframeContent from "./IframeContent.jsx";
import ImageViewerContent from "./ImageViewerContent.jsx";
import NowContent from "./NowContent.jsx";
import Terminal from "./Terminal.jsx";
import ToolsFolderContent from "./ToolsFolderContent.jsx";
import WeatherContent from "./WeatherContent.jsx";

/**
 * Chooses the content component for a window.
 * @param {{
 *   win: import("../lib/windowManager.js").WindowState,
 *   lastDeploy: string,
 *   onOpenTool: (slug: string, name: string, url: string) => void,
 *   onOpenApp: (id: string) => void,
 * }} props
 */
export default function WindowContent({ win, lastDeploy, onOpenTool, onOpenApp }) {
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
      return <Terminal onOpenTool={onOpenTool} onOpenApp={onOpenApp} />;
    case "files":
      return <FilesContent />;
    case "weather":
      return <WeatherContent />;
    case "calculator":
      return <CalculatorContent />;
    case "viewer":
      return <ImageViewerContent />;
    default:
      return null;
  }
}
