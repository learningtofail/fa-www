/**
 * Placeholder content for the Files, Weather and Image Viewer demo windows. None of it is real:
 * replace the city and readings with real data or remove the Weather app.
 */

/** @type {{ id: string, label: string, icon: string }[]} */
export const FILE_PLACES = [
  { id: "recent", label: "Recent", icon: "clock" },
  { id: "starred", label: "Starred", icon: "star" },
  { id: "home", label: "Home", icon: "home" },
  { id: "documents", label: "Documents", icon: "doc" },
  { id: "downloads", label: "Downloads", icon: "download" },
  { id: "music", label: "Music", icon: "music" },
  { id: "pictures", label: "Pictures", icon: "image" },
  { id: "videos", label: "Videos", icon: "video" },
  { id: "trash", label: "Trash", icon: "trash" },
];

/** Places shown as tabs on narrow Files windows (phones). */
export const FILE_TAB_IDS = ["home", "recent", "starred", "downloads"];

export const FILE_FOLDERS = [
  "Applications",
  "Desktop",
  "Documents",
  "Downloads",
  "Music",
  "Pictures",
  "Public",
  "Videos",
];

export const WEATHER = {
  city: "Shanghai, China",
  temperature: 13,
  hourly: [
    { label: "Now", temperature: 13 },
    { label: "22:00", temperature: 12 },
    { label: "23:00", temperature: 12 },
    { label: "00:00", temperature: 11 },
    { label: "01:00", temperature: 11 },
    { label: "02:00", temperature: 10 },
  ],
  daily: [
    { label: "Mon", high: 15, low: 9 },
    { label: "Tue", high: 16, low: 10 },
    { label: "Wed", high: 14, low: 9 },
    { label: "Thu", high: 17, low: 11 },
    { label: "Fri", high: 18, low: 12 },
  ],
};

export const VIEWER_IMAGE = {
  src: "/wallpaper-light.svg",
  name: "wallpaper-light.svg",
  alt: "Pink and violet wallpaper with layered curves",
};
