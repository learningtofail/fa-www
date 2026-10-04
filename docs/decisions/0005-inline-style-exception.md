# 0005: The one inline-style exception

Status: accepted.

## Decision

The rule is no inline styles and no inline event handlers. The single exception is `src/components/Window.jsx`, which passes a `style` object containing only the custom properties `--window-x`, `--window-y`, `--window-width`, `--window-height` and `--window-z`. All skin (color, border, radius, shadow) lives in `desktop.css` and reads tokens.

The line carries an `eslint-disable-next-line react/forbid-dom-props` comment that states the reason. No other file may add one.

## Why

Window position and size change on every pointer move. Generating a class per value is not possible, and rewriting a stylesheet per frame is worse. A custom property is geometry data, not skin, and setting it through React's `style` prop is applied through the CSSOM, which a Content-Security-Policy does not block. So the exception costs nothing in `style-src`: the proposed CSP needs no `style-src-attr` allowance.

## What would change it

Moving geometry to the Web Animations API or CSS anchor positioning. Then delete the exception and the lint comment together.
