import AboutContent from "./AboutContent.jsx";
import CalculatorContent from "./CalculatorContent.jsx";
import ContactContent from "./ContactContent.jsx";
import FilesContent from "./FilesContent.jsx";
import FolderContent from "./FolderContent.jsx";
import IframeContent from "./IframeContent.jsx";
import ImageViewerContent from "./ImageViewerContent.jsx";
import NowContent from "./NowContent.jsx";
import Terminal from "./Terminal.jsx";
import TextEditorContent from "./TextEditorContent.jsx";
import WeatherContent from "./WeatherContent.jsx";
import { isFolder } from "../data/folders.js";
import { isMarketingTool } from "../data/marketingTools.js";
import { MARKETING_FRAME, TOOL_FRAME } from "../data/tools.js";

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
  if (win.isTool) {
    const marketing = isMarketingTool(win.id.replace(/^tool:/, ""));
    return <IframeContent url={win.url ?? ""} label={win.title} frame={marketing ? MARKETING_FRAME : TOOL_FRAME} />;
  }
  if (isFolder(win.id)) return <FolderContent folder={win.id} onOpenTool={onOpenTool} />;
  switch (win.id) {
    case "about":
      return <AboutContent />;
    case "contact":
      return <ContactContent />;
    case "now":
      return <NowContent lastDeploy={lastDeploy} />;
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
    case "editor":
      return <TextEditorContent />;
    default:
      return null;
  }
}
