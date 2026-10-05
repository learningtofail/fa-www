import "../styles/tools-grid.css";
import { FOLDERS } from "../data/folders.js";
import AppIcon from "./AppIcon.jsx";

/**
 * A folder of apps: one tile per tool, in groups when the folder has headings. Choosing a tile opens
 * that tool in its own window (desktop) or full screen (phone).
 * @param {{
 *   folder: string,
 *   onOpenTool: (slug: string, name: string, url: string) => void,
 *   dense?: boolean,
 * }} props
 */
export default function FolderContent({ folder, onOpenTool, dense }) {
  const groups = FOLDERS[folder]?.groups ?? [];
  return (
    <div className="folder">
      {groups.map((group) => (
        <section key={group.id} className="folder__group" aria-label={group.heading || undefined}>
          {group.heading && <h2 className="folder__heading">{group.heading}</h2>}
          <div className={`tools-grid${dense ? " tools-grid--dense" : ""}`}>
            {group.items.map((item) => (
              <button
                key={item.slug}
                className="tools-grid__tile"
                onClick={() => onOpenTool(item.slug, item.name, item.url)}
                title={item.name}
              >
                <AppIcon glyph={item.glyph} tone={item.tone} size={dense ? "md" : "xl"} />
                <span className="tools-grid__label">{item.label}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
