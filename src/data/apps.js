// Shared app registry — both DesktopShell and MobileShell read from this so the
// set of "things on the desktop/home screen" can't drift between the two.
// `kind` drives which content renders: "window" uses the plain content components,
// "folder" opens a folder of tools (see data/folders.js), "terminal" opens the terminal emulator.
export const APPS = [
  { id: "about", label: "About", glyph: "\u{1F5D2}", tone: "about", kind: "window" },
  { id: "contact", label: "Contact", glyph: "\u{2709}", tone: "contact", kind: "window" },
  { id: "now", label: "Now", glyph: "\u{1F553}", tone: "now", kind: "window" },
  { id: "files", label: "Files", glyph: "\u{1F4C2}", tone: "files", kind: "window" },
  { id: "editor", label: "Text Editor", glyph: "\u{1F4DD}", tone: "editor", kind: "window" },
  { id: "calculator", label: "Calculator", glyph: "\u{1F9EE}", tone: "calculator", kind: "window" },
  { id: "weather", label: "Weather", glyph: "\u{26C5}", tone: "weather", kind: "window" },
  { id: "viewer", label: "Image Viewer", glyph: "\u{1F5BC}", tone: "viewer", kind: "window" },
  { id: "tools", label: "Tools", glyph: "\u{1F4C1}", tone: "tools", kind: "folder" },
  { id: "marketing", label: "Marketing", glyph: "\u{1F4CA}", tone: "marketing", kind: "folder" },
  { id: "terminal", label: "Terminal", glyph: "\u{2328}", tone: "terminal", kind: "terminal" },
];

// Desktop keeps the terminal and the utility apps (Files, Text Editor, Weather, Calculator, Image Viewer) dock-only,
// so the icon column stays short. Mobile has no separate app list, so every app is a home-screen icon.
const DOCK_ONLY = new Set(["terminal", "files", "editor", "weather", "calculator", "viewer"]);
export const DESKTOP_ICON_APPS = APPS.filter((a) => !DOCK_ONLY.has(a.id));

/** Apps the terminal's `open` command can launch (slug is the app id). */
export const OPENABLE_APPS = Object.freeze([
  { slug: "files", name: "Files" },
  { slug: "editor", name: "Text Editor" },
  { slug: "weather", name: "Weather" },
  { slug: "calculator", name: "Calculator" },
  { slug: "viewer", name: "Image Viewer" },
  { slug: "marketing", name: "Marketing" },
]);
