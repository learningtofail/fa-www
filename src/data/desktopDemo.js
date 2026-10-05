/**
 * Placeholder content for the Files and Image Viewer demo windows. None of it is real. (Weather is live: see
 * hooks/useWeather.js.)
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

export const VIEWER_IMAGE = {
  src: "/wallpaper-light.svg",
  name: "wallpaper-light.svg",
  alt: "Pink and violet wallpaper with layered curves",
};
