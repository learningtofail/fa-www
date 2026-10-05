/**
 * Offers `text` to the browser as a file download. The browser APIs are injected so the function is testable
 * and the side effects stay at the edge.
 * @param {string} name file name for the download
 * @param {string} text
 * @param {{
 *   createObjectURL: (blob: Blob) => string,
 *   revokeObjectURL: (url: string) => void,
 *   createLink: () => { href: string, download: string, click: () => void },
 * }} deps
 */
export function downloadText(name, text, deps) {
  const url = deps.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  try {
    const link = deps.createLink();
    link.href = url;
    link.download = name;
    link.click();
  } finally {
    deps.revokeObjectURL(url);
  }
}

/** The real browser dependencies for `downloadText`. */
export const browserDownloadDeps = {
  createObjectURL: (blob) => URL.createObjectURL(blob),
  revokeObjectURL: (url) => URL.revokeObjectURL(url),
  createLink: () => document.createElement("a"),
};
