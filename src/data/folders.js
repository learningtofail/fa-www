import { MARKETING_GROUPS, marketingUrl } from "./marketingTools.js";
import { TOOL_ICON, toolUrl, tools } from "./tools.js";

/**
 * Folder apps: a title and groups of tiles. Each tile opens one tool as its own window, so the Tools
 * folder (five Astro tools) and the Marketing folder (21 vendored pages) share one component.
 * @typedef {{ slug: string, name: string, label: string, glyph: string, tone: string, url: string }} FolderItem
 * @type {Readonly<Record<string, { title: string, groups: readonly { id: string, heading: string, items: readonly FolderItem[] }[] }>>}
 */
export const FOLDERS = Object.freeze({
  tools: {
    title: "Tools",
    groups: [
      {
        id: "all",
        heading: "",
        items: tools.map((tool) => ({
          ...TOOL_ICON,
          slug: tool.slug,
          name: tool.name,
          label: tool.name,
          url: toolUrl(tool.slug),
        })),
      },
    ],
  },
  marketing: {
    title: "Marketing",
    groups: MARKETING_GROUPS.map((group) => ({
      id: group.id,
      heading: group.heading,
      items: group.tools.map((tool) => ({ ...tool, tone: group.tone, url: marketingUrl(tool.slug) })),
    })),
  },
});

/** @param {string} id @returns {boolean} */
export const isFolder = (id) => Object.hasOwn(FOLDERS, id);
