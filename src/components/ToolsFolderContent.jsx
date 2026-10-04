import "../styles/tools-grid.css";
import { tools, toolUrl, TOOL_ICON } from "../data/tools.js";
import AppIcon from "./AppIcon.jsx";

/**
 * @param {{ onOpenTool: (slug: string, name: string, url: string) => void, dense?: boolean }} props
 */
export default function ToolsFolderContent({ onOpenTool, dense }) {
  return (
    <div className={`tools-grid${dense ? " tools-grid--dense" : ""}`}>
      {tools.map((tool) => (
        <button
          key={tool.slug}
          className="tools-grid__tile"
          onClick={() => onOpenTool(tool.slug, tool.name, toolUrl(tool.slug))}
          title={tool.name}
        >
          <AppIcon {...TOOL_ICON} size={dense ? "md" : "xl"} />
          <span className="tools-grid__label">{tool.name}</span>
        </button>
      ))}
    </div>
  );
}
