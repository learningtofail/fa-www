// Shared app registry — both DesktopShell and MobileShell read from this so the
// set of "things on the desktop/home screen" can't drift between the two.
// `kind` drives which content renders: "window" uses the plain content components,
// "folder" opens the tools grid, "terminal" opens the terminal emulator.
export const APPS = [
  { id: "about", label: "About", glyph: "\u{1F5D2}", color: "#4a7c9b", kind: "window" },
  { id: "contact", label: "Contact", glyph: "\u{2709}", color: "#5c9e6f", kind: "window" },
  { id: "now", label: "Now", glyph: "\u{1F553}", color: "#c9822a", kind: "window" },
  { id: "tools", label: "Tools", glyph: "\u{1F4C1}", color: "#a25c9b", kind: "folder" },
  { id: "terminal", label: "Terminal", glyph: "\u{2328}", color: "#2b2b2b", kind: "terminal" },
];

// Desktop keeps the terminal dock-only, not a desktop icon — a small remnant of
// "you have to know it's there" now that About/Contact/Now/Tools are all visible
// icons. Mobile has no separate dock, so every app (including Terminal) is a
// home-screen icon there.
export const DESKTOP_ICON_APPS = APPS.filter((a) => a.id !== "terminal");
