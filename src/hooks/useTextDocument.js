import { useCallback, useEffect, useState } from "react";
import { normalizeFileName, readDraft, saveDraft } from "../lib/textEditor.js";

const SAVE_DELAY_MS = 300;

/**
 * The Text Editor's document: name, text and whether it has changed since it was last saved or opened.
 * The draft is kept in localStorage (debounced) so a reload does not lose work. A restored, non-empty draft
 * counts as unsaved, because there is no way to know whether it was ever downloaded.
 */
export function useTextDocument() {
  const [doc, setDoc] = useState(() => readDraft(window.localStorage));
  const [dirty, setDirty] = useState(() => doc.text !== "");

  useEffect(() => {
    const timer = setTimeout(() => saveDraft(window.localStorage, doc), SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [doc]);

  const setText = useCallback((text) => {
    setDoc((current) => ({ ...current, text }));
    setDirty(true);
  }, []);
  const setName = useCallback((name) => setDoc((current) => ({ ...current, name })), []);
  /** Replaces the whole document (New, Open). */
  const replace = useCallback((name, text) => {
    setDoc({ name, text });
    setDirty(false);
  }, []);
  /** Marks the document saved under `name` (after a download). */
  const markSaved = useCallback((name) => {
    setDoc((current) => ({ ...current, name: normalizeFileName(name) }));
    setDirty(false);
  }, []);

  return { name: doc.name, text: doc.text, dirty, setText, setName, replace, markSaved };
}
