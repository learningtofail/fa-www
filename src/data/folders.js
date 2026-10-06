import { MARKETING_GROUPS, MARKETING_TOOLS } from "./marketingTools.js";

/**
 * Folder apps: a title and groups of tiles. Each tile opens one tool as its own window (full screen on the phone).
 * One folder today (Marketing); the registry and component stay generic so another folder is data, not code.
 * @typedef {{ slug: string, name: string, label: string, glyph: string, tone: string, url: string }} FolderItem
 * @type {Readonly<Record<string, { title: string, groups: readonly { id: string, heading: string, items: readonly FolderItem[] }[] }>>}
 */
export const FOLDERS = Object.freeze({
  marketing: {
    title: "Marketing",
    groups: MARKETING_GROUPS.map((group) => ({
      id: group.id,
      heading: group.heading,
      items: MARKETING_TOOLS.filter((tool) => group.tools.some((t) => t.slug === tool.slug)),
    })),
  },
});

/** @param {string} id @returns {boolean} */
export const isFolder = (id) => Object.hasOwn(FOLDERS, id);
