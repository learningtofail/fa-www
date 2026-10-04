/**
 * True when keyboard input at `target` is text entry, so shortcut handlers
 * (such as Escape-to-close) must leave the key alone.
 * @param {EventTarget | null} target
 * @returns {boolean}
 */
export function isTextEntryTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}
