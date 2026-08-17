import { tools, toolUrl } from "../data/tools.js";
import AppIcon from "./AppIcon.jsx";

const TOOL_COLOR = "#3a5a9b";

export default function ToolsFolderContent({ onOpenTool, dense }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: dense ? "repeat(auto-fill, minmax(72px, 1fr))" : "repeat(auto-fill, minmax(110px, 1fr))",
        gap: dense ? "0.75rem" : "1.25rem",
        padding: dense ? "0.5rem" : "0.5rem 0",
      }}
    >
      {tools.map((tool) => (
        <button
          key={tool.slug}
          onClick={() => onOpenTool(tool.slug, tool.name, toolUrl(tool.slug))}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.5rem",
            fontFamily: "system-ui, sans-serif",
            color: "inherit",
          }}
          title={tool.name}
        >
          <AppIcon glyph={"\u{1F527}"} color={TOOL_COLOR} size={dense ? 48 : 56} />
          <span style={{ fontSize: "0.72rem", textAlign: "center", lineHeight: 1.25 }}>{tool.name}</span>
        </button>
      ))}
    </div>
  );
}
