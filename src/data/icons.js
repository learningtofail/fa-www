/**
 * Line icons on a 16x16 grid. Path data only; stroke, size and color come from icon.css.
 * Add an entry here, then render it with <Icon name="..." />.
 * @type {Record<string, string>}
 */
export const ICON_PATHS = {
  minimize: "M3 12h10",
  maximize: "M3 3h10v10H3z",
  restore: "M5.5 5.5h7.5V13H5.5zM3 10.5V3h7.5",
  close: "M3.5 3.5l9 9M12.5 3.5l-9 9",
  ethernet: "M2 3h12v8H2zM5 14h6M8 11v3",
  volume: "M2 6h2.5L8 3v10L4.5 10H2zM10.5 5.5a3.5 3.5 0 010 5",
  power: "M8 2v6M4.8 4.5a5.2 5.2 0 106.4 0",
  sun: "M8 11a3 3 0 100-6 3 3 0 000 6zM8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M13 3l-1 1M4 12l-1 1",
  contrast: "M8 14a6 6 0 100-12 6 6 0 000 12zM8 2v12",
  cup: "M3 6h8v4a3 3 0 01-3 3H6a3 3 0 01-3-3zM11 7h1.5a1.5 1.5 0 010 3H11",
  back: "M10 3L5 8l5 5",
  search: "M7 12a5 5 0 100-10 5 5 0 000 10zM11 11l3.5 3.5",
  home: "M2 8l6-5.5L14 8M3.5 7v6.5h9V7",
  clock: "M8 14a6 6 0 100-12 6 6 0 000 12zM8 5v3l2 1.5",
  star: "M8 2l1.8 3.7 4.1.6-3 2.9.7 4.1L8 11.4l-3.6 1.9.7-4.1-3-2.9 4.1-.6z",
  doc: "M4 2h5l3 3v9H4zM9 2v3h3",
  download: "M8 2v8M4.5 7L8 10.5 11.5 7M3 13.5h10",
  music: "M6 12V3.5l7-1.5v8.5M6 12a1.8 1.8 0 11-3.6 0A1.8 1.8 0 016 12zM13 10.5a1.8 1.8 0 11-3.6 0 1.8 1.8 0 013.6 0z",
  image: "M2 3h12v10H2zM2 11l4-4 3 3 2-2 3 3",
  video: "M2 3h12v10H2zM6.5 5.5v5l4-2.5z",
  trash: "M3 4.5h10M6 4.5V3h4v1.5M4.5 4.5l.7 9h5.6l.7-9",
  plus: "M8 3v10M3 8h10",
  minus: "M3 8h10",
  folder: "M2 4.5h4l1.5 1.5H14v7H2z",
  wrap: "M2 4h12M2 8h9a2 2 0 010 4H8M9.5 10.5L8 12l1.5 1.5M2 12h3",
  moon: "M13 9.5A5.5 5.5 0 116.5 3a4.5 4.5 0 006.5 6.5z",
};
