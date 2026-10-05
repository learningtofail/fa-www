/**
 * Quick Settings toggles. Only `theme: true` does anything real (Dark Style switches the theme).
 * The rest are cosmetic, like the rest of the tray. Delete entries you do not want.
 * @type {{ id: string, label: string, icon: string, initial?: boolean, theme?: boolean }[]}
 */
export const QUICK_TOGGLES = [
  { id: "wired", label: "Wired", icon: "ethernet", initial: true },
  { id: "night-light", label: "Night Light", icon: "sun", initial: true },
  { id: "dark-style", label: "Dark Style", icon: "contrast", theme: true },
  { id: "caffeine", label: "Caffeine", icon: "cup" },
];

export const INITIAL_VOLUME = 42;
