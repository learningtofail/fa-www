import { tools, toolUrl } from "../data/tools.js";
import AppIcon from "./AppIcon.jsx";

const TOOL_COLOR = "#3a5a9b";

/**
 * @param {{ onOpenTool: (slug: string, name: string, url: string) => void, dense?: boolean }} props
 */
export default function ToolsFolderContent({ onOpenTool, dense }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: dense ? "repeat(auto-fill, minmax(72px, 1fr))" : "repeat(auto-fill, minmax(110px, 1fr))",
        gap: dense ? "var(--space-2x)" : "var(--space-4x)",
        padding: dense ? "var(--space-2x)" : "var(--space-2x) 0",
      }}
    >
      {tools.map((tool) => (
        <button
          key={tool.slug}
          className="tool-tile"
          onClick={() => onOpenTool(tool.slug, tool.name, toolUrl(tool.slug))}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--space-half)",
            padding: "var(--space-2x)",
            borderRadius: "var(--radius-material)",
            fontFamily: "var(--font-ui)",
            color: "inherit",
            transition: "var(--transition-chrome)",
          }}
          title={tool.name}
        >
          <AppIcon glyph={"\u{1F527}"} color={TOOL_COLOR} size={dense ? 48 : 56} />
          <span style={{ fontSize: "0.72rem", textAlign: "center", lineHeight: "var(--line-height-tight)" }}>
            {tool.name}
          </span>
        </button>
      ))}
    </div>
  );
}
