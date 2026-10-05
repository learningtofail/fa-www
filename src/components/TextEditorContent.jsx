import { useRef, useState } from "react";
import "../styles/text-editor.css";
import Icon from "./Icon.jsx";
import { useTextDocument } from "../hooks/useTextDocument.js";
import { browserDownloadDeps, downloadText } from "../lib/fileDownload.js";
import {
  DEFAULT_EDITOR_ZOOM,
  DEFAULT_FILE_NAME,
  EDITOR_ZOOM_STEPS,
  MAX_FILE_BYTES,
  countText,
  cursorPosition,
  isOpenable,
  normalizeFileName,
  stepEditorZoom,
} from "../lib/textEditor.js";

/** Text editor window body: new, open, save, word wrap, zoom and a status bar. Files never leave the browser. */
export default function TextEditorContent() {
  const doc = useTextDocument();
  const [caret, setCaret] = useState(0);
  const [wrap, setWrap] = useState(true);
  const [zoom, setZoom] = useState(DEFAULT_EDITOR_ZOOM);
  const [pending, setPending] = useState(/** @type {"new" | "open" | null} */ (null));
  const [error, setError] = useState("");
  const fileInput = useRef(/** @type {HTMLInputElement | null} */ (null));
  const textArea = useRef(/** @type {HTMLTextAreaElement | null} */ (null));

  const { line, column } = cursorPosition(doc.text, caret);
  const { words, characters } = countText(doc.text);

  const save = () => {
    const name = normalizeFileName(doc.name);
    downloadText(name, doc.text, browserDownloadDeps);
    doc.markSaved(name);
    setError("");
  };

  /** Runs `run` at once, or on the second click when there are unsaved changes to discard. */
  const confirmThen = (kind, run) => {
    if (doc.dirty && pending !== kind) return setPending(kind);
    setPending(null);
    run();
  };
  const startNew = () => {
    doc.replace(DEFAULT_FILE_NAME, "");
    setCaret(0);
    setError("");
    textArea.current?.focus();
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // choosing the same file again must fire change again
    if (!file) return;
    if (!isOpenable(file.size)) return setError(`${file.name} is larger than ${MAX_FILE_BYTES / 1_000_000} MB.`);
    try {
      doc.replace(normalizeFileName(file.name), await file.text());
      setCaret(0);
      setError("");
    } catch {
      setError(`Could not read ${file.name}.`);
    }
  };

  const onShortcut = (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const key = e.key.toLowerCase();
    if (key === "s") save();
    else if (key === "o") fileInput.current?.click();
    else return;
    e.preventDefault();
  };

  return (
    <div className="editor">
      <div className="editor__bar">
        <button className="editor__btn" onClick={() => confirmThen("new", startNew)} onBlur={() => setPending(null)}>
          <Icon name="plus" />
          {pending === "new" ? "Discard changes?" : "New"}
        </button>
        <button
          className="editor__btn"
          onClick={() => confirmThen("open", () => fileInput.current?.click())}
          onBlur={() => setPending(null)}
        >
          <Icon name="folder" />
          {pending === "open" ? "Discard changes?" : "Open"}
        </button>
        <input
          ref={fileInput}
          hidden
          type="file"
          accept=".txt,.md,.json,.csv,.log,text/*"
          aria-label="Choose a text file"
          onChange={onFile}
        />
        <button className="editor__btn" onClick={save}>
          <Icon name="download" />
          Save
        </button>
        <input
          className="editor__name"
          aria-label="File name"
          value={doc.name}
          spellCheck={false}
          onChange={(e) => doc.setName(e.target.value)}
          onKeyDown={onShortcut}
        />
        <button
          className="editor__btn editor__btn--icon"
          aria-label="Word wrap"
          aria-pressed={wrap}
          onClick={() => setWrap((w) => !w)}
        >
          <Icon name="wrap" />
        </button>
        <button
          className="editor__btn editor__btn--icon"
          aria-label="Zoom out"
          disabled={zoom === EDITOR_ZOOM_STEPS[0]}
          onClick={() => setZoom((z) => stepEditorZoom(z, -1))}
        >
          <Icon name="minus" />
        </button>
        <output className="editor__zoom" aria-live="polite">
          {zoom}%
        </output>
        <button
          className="editor__btn editor__btn--icon"
          aria-label="Zoom in"
          disabled={zoom === EDITOR_ZOOM_STEPS[EDITOR_ZOOM_STEPS.length - 1]}
          onClick={() => setZoom((z) => stepEditorZoom(z, 1))}
        >
          <Icon name="plus" />
        </button>
      </div>
      <textarea
        ref={textArea}
        className="editor__text"
        data-zoom={zoom}
        aria-label="Document text"
        placeholder="Start typing. Your draft stays in this browser until you save it as a file."
        value={doc.text}
        wrap={wrap ? "soft" : "off"}
        onChange={(e) => {
          doc.setText(e.target.value);
          setCaret(e.target.selectionStart);
        }}
        onSelect={(e) => setCaret(e.currentTarget.selectionStart)}
        onKeyDown={onShortcut}
      />
      {error && (
        <p className="editor__error" role="alert">
          {error}
        </p>
      )}
      <div className="editor__status">
        <span>
          Ln {line}, Col {column}
        </span>
        <span>{words} words</span>
        <span>{characters} characters</span>
        <span className="editor__state" role="status">
          {doc.dirty ? "Unsaved changes" : "Saved"}
        </span>
      </div>
    </div>
  );
}
