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

Three layers.

1. `src/styles/orchis.tokens.css`: generated copy of the Orchis design system tokens (fonts, colors, typography, spacing, radius, elevation, motion). `src/styles/orchis.manifest.json` pins the DS commit and records the sha256 of the generated file. The DS repo has no `package.json` or tag, so the pin is a commit SHA. `npm run tokens:check` rebuilds the file from GitHub at that SHA and fails on any difference, and CI runs it with `--require-network`. The DS `chrome.css` values are not vendored: they started life in fa-www, so they live in layer 2.
2. `src/styles/site.tokens.css`: fa-www's own decisions. Self-hosted font family names, shell chrome, window-content colors, the D5 accessibility overrides, app icon tones, and layout metrics (`--tile-margin`, `--tile-gap`, `--desktop-surface-bottom`). It also switches off every transition under `prefers-reduced-motion`.
3. Component CSS in BEM, reading tokens only. Skin is never inline. The exception is `Window.jsx`, which sets `--window-*` custom properties for geometry.

Fonts come from `@fontsource-variable/hanken-grotesk`, `@fontsource/instrument-serif` and `@fontsource-variable/jetbrains-mono`, bundled by Vite, so there is no third-party font request.

## Windows and terminal

`Window.jsx` drags and resizes with Pointer Events and pointer capture, clamped to the desktop surface by `src/lib/windowGeometry.js`. Activities tiling uses `src/lib/layout.js`, which reads the layout tokens and measures the desktop surface. Escape closes the window that holds focus, never while typing in a field (`src/lib/keyboard.js`). The terminal resolves paths with `src/lib/terminal/path.js`. The contact form endpoint comes from `src/lib/config.js`.

## Quality gates

Lint (ESLint 9, pinned rules with commented exceptions), Stylelint, `tokens:check`, Prettier, `tsc --noEmit` with `checkJs`, Vitest unit tests, Playwright e2e plus axe. No known-defect pins remain: D3 to D7 are fixed and tested. `tests/unit/contrast.test.js` recomputes the WCAG ratio of every text and background token pair, and the axe e2e tests run with every rule, color-contrast included.

## Delivery

`.github/workflows/ci.yml`: static checks, unit tests, build plus e2e, and a blocking `npm audit --omit=dev --audit-level=high` run on every PR and push. On push to `main`, once every job (audit included) passes, the deploy job downloads the built `dist` artifact and rsyncs it over Tailscale to `/opt/static-web/sites/www/`.
