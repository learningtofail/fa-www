# Architecture (current state)

## Runtime

`src/pages/index.astro` mounts `Desktop` with `client:only="react"`. The shell never renders on the server, because `useIsMobile()` reads `matchMedia` and a server render would always mismatch on phones. The page is `noindex, nofollow`.

`Desktop.jsx` picks `DesktopShell.jsx` or `MobileShell.jsx` from `useIsMobile()` (live `matchMedia("(max-width: 768px)")`). Resizing across the breakpoint swaps shells without a reload.

## Data

| File                          | Role                                                                                         |
| ----------------------------- | -------------------------------------------------------------------------------------------- |
| `src/data/apps.js`            | App registry shared by both shells. `DESKTOP_ICON_APPS` excludes the terminal.               |
| `src/data/tools.js`           | Tool slugs and `toolUrl()`. Hand-mirrored from fa-portfolio. Neither repo imports the other. |
| `src/data/terminalContent.js` | Virtual filesystem and terminal flavor text.                                                 |

## Components

Content components (`About`, `Contact`, `Now`, `Iframe`, `ToolsFolder`, `Terminal`) carry no window-chrome assumptions. Desktop wraps them in `Window.jsx`; mobile renders them full screen or in a popup.

## Styles

`src/styles/tokens.css` is vendored from the Orchis design system and excluded from Prettier. `src/styles/site.tokens.css` loads after it and holds fa-www's own overrides (the D5 AA-passing link, primary, visited, placeholder and success colors). `desktop.css`, `mobile.css`, `form.css` and `terminal.css` hold the rest. Inline styles still exist in several components; Phase 3 of the refactor plan removes them.

## Windows and terminal

`Window.jsx` drags and resizes with Pointer Events and pointer capture, clamped to the desktop surface by `src/lib/windowGeometry.js`. Escape closes the window that holds focus, never while typing in a field (`src/lib/keyboard.js`). The terminal resolves paths with `src/lib/terminal/path.js`. The contact form endpoint comes from `src/lib/config.js`.

## Quality gates

Lint (ESLint 9, pinned rules with commented exceptions), Prettier, `tsc --noEmit` with `checkJs`, Vitest unit tests, Playwright e2e plus axe. No known-defect pins remain: D3 to D7 are fixed and tested. `tests/unit/contrast.test.js` recomputes the WCAG ratio of every text and background token pair, and the axe e2e tests run with every rule, color-contrast included.

## Delivery

`.github/workflows/ci.yml`: static checks, unit tests, build plus e2e, and a blocking `npm audit --omit=dev --audit-level=high` run on every PR and push. On push to `main`, once every job (audit included) passes, the deploy job downloads the built `dist` artifact and rsyncs it over Tailscale to `/opt/static-web/sites/www/`.
