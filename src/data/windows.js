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
  files: { title: "Files", x: 120, y: 90, width: 700, height: 440 },
  weather: { title: "Weather", x: 80, y: 60, width: 520, height: 440 },
  calculator: { title: "Calculator", x: 700, y: 80, width: 320, height: 420 },
  viewer: { title: "Image Viewer", x: 560, y: 120, width: 440, height: 340 },
  editor: { title: "Text Editor", x: 200, y: 110, width: 560, height: 400 },
};

/** Windows that start open, in stacking order (first is lowest). */
export const INITIALLY_OPEN = ["about", "contact", "now"];

/** Dock order for the fixed apps. */
export const DOCK_APP_IDS = [
  "about",
  "contact",
  "now",
  "files",
  "editor",
  "weather",
  "calculator",
  "viewer",
  "tools",
  "terminal",
];

/** Apps in the phone dock, in order. */
export const MOBILE_DOCK_IDS = ["files", "calculator", "weather", "viewer"];

/** Windows whose body fills the frame edge to edge (no content padding). */
export const NO_PADDING_WINDOWS = new Set(["terminal", "files", "editor", "weather", "calculator", "viewer"]);

/** Geometry for a tool window. Each new one is offset by `step` per open window so they cascade. */
export const TOOL_WINDOW = Object.freeze({ x: 160, y: 120, width: 640, height: 480, step: 12 });
