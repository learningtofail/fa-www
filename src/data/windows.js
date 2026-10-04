/**
 * Default window geometry. Pure data: the window manager reducer (lib/windowManager.js)
 * decides what is open and where.
 */

/** @type {Record<string, { title: string, x: number, y: number, width: number, height: number }>} */
export const FIXED_WINDOWS = {
  about: { title: "about.txt", x: 140, y: 60, width: 420, height: 260 },
  contact: { title: "contact.txt", x: 580, y: 90, width: 380, height: 320 },
  now: { title: "status.txt", x: 180, y: 360, width: 360, height: 190 },
  tools: { title: "Tools", x: 620, y: 420, width: 420, height: 320 },
  terminal: { title: "terminal", x: 480, y: 440, width: 520, height: 300 },
};

/** Windows that start open, in stacking order (first is lowest). */
export const INITIALLY_OPEN = ["about", "contact", "now"];

/** Dock order for the fixed apps. */
export const DOCK_APP_IDS = ["about", "contact", "now", "tools", "terminal"];

/** Geometry for a tool window. Each new one is offset by `step` per open window so they cascade. */
export const TOOL_WINDOW = Object.freeze({ x: 160, y: 120, width: 640, height: 480, step: 12 });
