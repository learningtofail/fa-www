# 0004: Window keyboard policy

Status: accepted. Implemented in `src/lib/keyboard.js`, `src/lib/windowGeometry.js`, `src/hooks/useWindowGestures.js`.

## Decision

- Focus on a window's title button, then arrow keys move the window by the `--window-key-step` token (16 px); Shift plus arrows resize it by the same step. Both clamp to the viewport and the minimum size.
- Escape closes the focused window, except when the event target is an input, textarea, select or contenteditable (`isTextEntryTarget`). Pressing Escape while typing in the terminal or the contact form does nothing.
- Opening a window moves focus into it (the terminal goes to its input). Closing returns focus to the control that opened it (`useFocusReturn`).

## Why

Pointer-only move and resize fails WCAG 2.1.1 (keyboard operable). Escape must never discard what someone is typing. Fixed 16 px steps keep the behavior predictable and testable.

## What would change it

A screen-reader pass that finds the title button a poor place for the gesture. Move it to a dedicated handle and keep the same keys.
