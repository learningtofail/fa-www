/** Pure helpers for the Text Editor app: cursor position, counts, file names, zoom steps and the saved draft. */

/** Largest file the editor opens, in bytes. A plain textarea gets slow well before a browser tab runs out of memory. */
export const MAX_FILE_BYTES = 1_000_000;
export const DEFAULT_FILE_NAME = "untitled.txt";
const MAX_NAME_LENGTH = 80;

/** Font zoom steps in percent. Keep these in sync with the `data-zoom` rules in text-editor.css. */
export const EDITOR_ZOOM_STEPS = [75, 100, 125, 150, 200];
export const DEFAULT_EDITOR_ZOOM = 100;

export const DRAFT_KEY = "fa-www:editor-draft";

/**
 * @param {string} text
 * @param {number} offset caret offset into `text` (selectionStart)
 * @returns {{ line: number, column: number }} 1-based line and column
 */
export function cursorPosition(text, offset) {
  const before = text.slice(0, Math.max(0, offset));
  const lastBreak = before.lastIndexOf("\n");
  const line = before.split("\n").length;
  return { line, column: before.length - lastBreak };
}

/**
 * @param {string} text
 * @returns {{ lines: number, words: number, characters: number }}
 */
export function countText(text) {
  const trimmed = text.trim();
  return {
    lines: text === "" ? 0 : text.split("\n").length,
    words: trimmed === "" ? 0 : trimmed.split(/\s+/).length,
    characters: [...text].length,
  };
}

/**
 * Makes a safe download name: no path separators or reserved characters, an extension, a sane length.
 * @param {string} raw
 * @returns {string}
 */
export function normalizeFileName(raw) {
  const cleaned = raw
    // eslint-disable-next-line no-control-regex -- stripping control characters is the point
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+/, "");
  if (cleaned === "") return DEFAULT_FILE_NAME;
  const named = /\.[A-Za-z0-9]{1,8}$/.test(cleaned) ? cleaned : `${cleaned}.txt`;
  if (named.length <= MAX_NAME_LENGTH) return named;
  const dot = named.lastIndexOf(".");
  const extension = named.slice(dot);
  return named.slice(0, MAX_NAME_LENGTH - extension.length) + extension;
}

/**
 * @param {number} bytes
 * @returns {boolean} whether a file of this size may be opened
 */
export function isOpenable(bytes) {
  return bytes <= MAX_FILE_BYTES;
}

/**
 * @param {number} current a value from EDITOR_ZOOM_STEPS
 * @param {1 | -1} direction
 * @returns {number} the next step, or `current` at either end
 */
export function stepEditorZoom(current, direction) {
  const index = EDITOR_ZOOM_STEPS.indexOf(current);
  const from = index === -1 ? EDITOR_ZOOM_STEPS.indexOf(DEFAULT_EDITOR_ZOOM) : index;
  return EDITOR_ZOOM_STEPS[from + direction] ?? current;
}

/** @typedef {{ name: string, text: string }} Draft */

/**
 * @param {Pick<Storage, "getItem">} storage
 * @returns {Draft} the saved draft, or an empty document when there is none or it is unreadable
 */
export function readDraft(storage) {
  const empty = { name: DEFAULT_FILE_NAME, text: "" };
  try {
    const parsed = JSON.parse(storage.getItem(DRAFT_KEY) ?? "null");
    if (typeof parsed?.text !== "string" || typeof parsed?.name !== "string") return empty;
    if (parsed.text.length > MAX_FILE_BYTES) return empty;
    return { name: normalizeFileName(parsed.name), text: parsed.text };
  } catch {
    return empty; // storage blocked or the value is not JSON
  }
}

/**
 * @param {Pick<Storage, "setItem">} storage
 * @param {Draft} draft
 * @returns {boolean} false when the browser refused the write (storage blocked or full)
 */
export function saveDraft(storage, draft) {
  try {
    storage.setItem(DRAFT_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}
