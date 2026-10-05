# Architecture (current state)

## Runtime

`src/pages/index.astro` mounts `Desktop` with `client:only="react"`. The shell never renders on the server, because `useIsMobile()` reads `matchMedia` and a server render would always mismatch on phones. The page is `noindex, nofollow`.

`Desktop.jsx` picks `DesktopShell.jsx` or `MobileShell.jsx` from `useIsMobile()` (live `matchMedia("(max-width: 768px)")`). Resizing across the breakpoint swaps shells without a reload.

## Data

| File                          | Role                                                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/data/apps.js`            | App registry shared by both shells. `DESKTOP_ICON_APPS` excludes the terminal.                                                                   |
| `src/data/tools.js`           | Tool slugs, `toolUrl()`, `TOOL_ICON`, and the `TOOL_FRAME` sandbox attributes. Hand-mirrored from the portfolio; neither repo imports the other. |
| `src/data/windows.js`         | Default window geometry, which windows start open, dock order, tool window cascade.                                                              |
| `src/data/profile.js`         | Single source for bio and contact copy. The years figure is computed from 2004.                                                                  |
| `src/data/terminalContent.js` | Terminal flavor text, `MESSAGES`, and `createFilesystem()` (built from the profile).                                                             |

## Components

`Desktop.jsx` picks `DesktopShell` or `MobileShell` from `useIsMobile()`. `DesktopShell` is composition only: `useWindowManager` owns state, and `Dock`, `DesktopIconGrid`, `Window` and `WindowContent` render it. `MobileShell` shows the icon grid, a `FolderPopup` for tools and a `MobileAppView` per app. Content components (`About`, `Contact`, `Now`, `IframeContent`, `ToolsFolder`, `Terminal`) carry no window-chrome assumptions and are shared by both shells.

`index.astro` also renders a `<noscript>` block with the About and Contact text, since the shell is a client-only island.

## State and logic

- `src/lib/windowManager.js`: `createWindowReducer(defaults)` returns a pure reducer for `open`, `openTool`, `close`, `focus`, `minimize`, `move`, `resize`, `tile` and `fit`. The measured desktop surface and layout tokens arrive in the action. `useWindowManager` measures the surface, observes its size to dispatch `fit`, and exposes stable callbacks.
- `src/lib/terminal/TerminalEngine.js`: a class holding `#cwd` and a `Map` of commands, with `{ filesystem, tools, toolUrl, portfolioUrl, messages }` injected. `execute(raw)` returns `{ lines, effects }`. Effects are `clear`, `open-url` and `open-tool`; `Terminal.jsx` carries them out. This differs slightly from the plan, which injected `openUrl` and `openTool`: returning effects keeps the engine side-effect free and trivially testable.
- `src/lib/terminal/path.js` resolves virtual paths, `history.js` does arrow-key recall.
- `src/hooks/useFocusReturn.js`: when a user action opens a dialog, focus moves into it and returns to the opener on close. Windows that are open at page load do not take focus.
- `src/hooks/useWindowGestures.js`: Pointer Events with capture for drag and resize, and keyboard move and resize on the title button (arrow keys move by `--window-key-step`, Shift plus arrow resizes).

## Tool frames

`IframeContent` embeds a tool with `sandbox="allow-scripts allow-same-origin allow-downloads"`, `loading="lazy"` and `referrerpolicy="strict-origin"`. It always shows a link that opens the tool in a new tab, and shows a notice if the frame has not loaded within 10 seconds, because a page can only detect a header-blocked frame by its absence. The origin comes from `PUBLIC_TOOLS_ORIGIN`.

## Styles

Three layers.

1. `src/styles/orchis.tokens.css`: generated copy of the Orchis design system tokens (fonts, colors, typography, spacing, radius, elevation, motion). `src/styles/orchis.manifest.json` pins the DS commit and records the sha256 of the generated file. The DS repo has no `package.json` or tag, so the pin is a commit SHA. `npm run tokens:check` rebuilds the file from GitHub at that SHA and fails on any difference, and CI runs it with `--require-network`. The DS `chrome.css` values are not vendored: they started life in fa-www, so they live in layer 2.
2. `src/styles/site.tokens.css`: fa-www's own decisions. Self-hosted font family names, shell chrome, window-content colors, the D5 accessibility overrides, app icon tones, and layout metrics (`--tile-margin`, `--tile-gap`, `--desktop-surface-bottom`). It also switches off every transition under `prefers-reduced-motion`.
3. Component CSS in BEM, reading tokens only. Skin is never inline. The exception is `Window.jsx`, which sets `--window-*` custom properties for geometry.

Fonts come from `@fontsource-variable/hanken-grotesk`, `@fontsource/instrument-serif` and `@fontsource-variable/jetbrains-mono`, bundled by Vite, so there is no third-party font request.

## Windows and keyboard

Windows drag and resize with Pointer Events, clamped to the desktop surface by `src/lib/windowGeometry.js`. Activities tiling uses `src/lib/layout.js`. Escape closes the window that holds focus, never while typing in a field (`src/lib/keyboard.js`). Each window has a focusable title button that moves it with the arrow keys and resizes it with Shift plus the arrow keys, which closes the old keyboard gap.

## Quality gates

Lint (ESLint 9, pinned rules with commented exceptions), Stylelint, `tokens:check`, Prettier, `tsc --noEmit` with `checkJs`, Vitest unit tests (coverage threshold of 90 percent on `src/lib`), Playwright e2e plus axe. No known-defect pins remain: D3 to D7 are fixed and tested. `tests/unit/contrast.test.js` recomputes the WCAG ratio of every text and background token pair, and the axe e2e tests run with every rule, color-contrast included.

## Delivery

`.github/workflows/ci.yml` jobs: `static` (ESLint, Stylelint, `tokens:check --require-network`, Prettier, typecheck), `unit`, `build` (builds once, fails on an empty `dist/index.html`, uploads the `dist` artifact), `e2e` (downloads that artifact, so the tested bytes are the deployed bytes), `audit` (blocking `npm audit --omit=dev --audit-level=high`), and `deploy`.

`deploy` runs on push to `main` only, after every other job. It has `environment: production`, `permissions: contents: read`, and a queuing `concurrency` group (never cancels a running deploy). It stops with a clear error when the `SSH_KNOWN_HOSTS` secret is empty, joins the tailnet with `tailscale/github-action` pinned by commit SHA, and runs `scripts/deploy.sh` with secrets passed through `env:`.

`scripts/deploy.sh` rsyncs into `releases/<sha>/` under `/opt/static-web/sites/www/` (never into the served root, so no `--delete` can touch live files), then `scripts/activate-release.sh` repoints the `current` symlink with an atomic rename and keeps the last five releases. Caddy serves `current`. Host key checking is strict against the pinned `SSH_KNOWN_HOSTS`. Both scripts have tests that run them in temp directories (`tests/unit/deploy.test.js`).

Security headers and a hash-based CSP (inline Astro scripts allowed by SHA-256, no `unsafe-inline`) are proposed in `docs/caddy/Caddyfile.proposed.md` and verified against the real build by `tests/e2e/csp.spec.js`. Rollback and monitoring: `docs/rollback.md`.

## Theme and apps

`useTheme` (via `Desktop.jsx`) reads the saved theme, mirrors it to `data-theme` on `<html>` and passes `theme` and `onThemeChange` to both shells. `site.light.tokens.css` redefines the surface, text and accent tokens under `data-theme="light"`; the dark values are the defaults in the other token files. Quick Settings (`QuickSettings.jsx`, a popover on the desktop and a sheet on the phone) is the only place the theme changes. The window manager gained a `maximize` action; `move` and `resize` are ignored while maximized, and `tile` and `close` restore the window first. The terminal engine returns `"error"` lines and an `open-app` effect, and takes the openable apps as an injected `apps` dependency. Files, Weather, Calculator and Image Viewer are content components shared by both shells. Their placeholder data lives in `src/data/desktopDemo.js`. See decision 0007.

The Text Editor (`TextEditorContent.jsx`) is a plain textarea. Its document state and the local draft live in `useTextDocument`; cursor math, counts, file-name cleaning and draft storage are pure functions in `lib/textEditor.js`, and `lib/fileDownload.js` takes the browser APIs as arguments. Nothing leaves the browser. See decision 0008.

The Weather app (`WeatherContent.jsx` with `WeatherNow`, `WeatherForecast`, `WeatherSearch`) is the one app that calls a third party. `useWeather` loads a forecast for the chosen place and unit and aborts a superseded request; `useWeatherPrefs` keeps the place and unit in `localStorage`. Request building, response parsing, WMO code names, error text and stored preferences are pure modules in `lib/weather/`, with `fetch` injected. The two Open-Meteo origins are in `connect-src`. See decision 0009.

Folders (Tools, Marketing) are data in `data/folders.js`: a title and groups of tiles. `FolderContent` renders one in a window or, on the phone, in `MobileFolderPopup`. Each tile opens a tool window (`isTool`), and `WindowContent` picks `MARKETING_FRAME` for the 21 marketing slugs and `TOOL_FRAME` for the rest. The Dock asks `marketingIcon` for the per-tool glyph and color. See decision 0010.
