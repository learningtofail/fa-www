# 0008: Text Editor app

Status: accepted. Implemented in `src/components/TextEditorContent.jsx`, `src/hooks/useTextDocument.js`, `src/lib/textEditor.js` and `src/lib/fileDownload.js`.

## Decision

- The editor is a plain `<textarea>` with New, Open, Save, word wrap, zoom (75 to 200 percent) and a status bar (line, column, words, characters, saved state). No editor library and no server.
- Files never leave the browser. Open reads a file the visitor picks (up to 1 MB). Save downloads a Blob through an injected `downloadText`. Nothing is uploaded and there is no network call.
- The working draft is kept in `localStorage["fa-www:editor-draft"]` (debounced 300 ms), so a reload does not lose work. A restored non-empty draft counts as unsaved, so New and Open ask before replacing it.
- File names are cleaned by `normalizeFileName` (no path separators or reserved characters, an extension, at most 80 characters).
- Error text uses `--text-error`, a token in both theme layers. Stock Orchis `--error` is a fill color and fails 4.5:1 as text on window surfaces.

## Why

A visitor-facing editor must not be able to reach anything of yours. With no backend there is nothing to reach, and the CSP (`connect-src` to the contact API only, no new origins) stays as it is. A textarea needs no extra JavaScript, no inline `<style>` and no CSP change, which Monaco would have needed.

## What would change it

A need for syntax highlighting, multiple tabs or real files on disk. Host a code editor on a separate sandboxed origin (the tool-frame pattern) instead of loading it into this page.
