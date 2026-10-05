# CLAUDE.md

Astro 7 static site, React 19 island. See `docs/architecture.md` for the current design.

## Commands

- `npm run check`: lint, Stylelint, token check, format check, typecheck, unit tests with coverage (src/lib must stay at or above 90 percent on every metric). Run before every commit.
- `npm run build` then `npm run test:e2e`: Playwright serves `astro preview`. Astro 7 `preview` backgrounds itself in non-TTY shells, so the Playwright config passes `--ignore-lock` to keep it in the foreground. Set `PW_CHROMIUM_PATH` to an existing Chromium binary when Playwright's own download is unavailable.
- `npm run lint:fix`, `npm run format`.
- `npm run lint:css`: Stylelint (`color-no-hex`, no `!important`) on `src/**/*.{css,astro}`.
- `npm run tokens:check`: rebuilds the vendored Orchis tokens from the pinned DS commit and diffs them. Offline it falls back to the recorded sha256; CI runs it with `--require-network`. `npm run tokens:sync` rewrites the vendored file after you change the pin in `src/styles/orchis.manifest.json`.

## Repo map

- `src/components/`: React components, none over about 150 lines. `Desktop.jsx` switches shells. `DesktopShell.jsx` is composition only (`Dock`, `DesktopIconGrid`, `Window`, `WindowContent`); `MobileShell.jsx` uses `MobileAppView` and a folder popup. Content components (`About`, `Contact`, `Now`, `Terminal`, `ToolsFolder`, `IframeContent`, `FilesContent`, `TextEditorContent`, `WeatherContent`, `CalculatorContent`, `ImageViewerContent`) are shared by both shells. `Icon` draws the line icons, `WeatherNow`, `WeatherForecast` and `WeatherSearch` are the parts of the Weather window, `QuickSettings` is the tray popover and phone sheet, `MobileStatusBar` and `MobileFolderPopup` belong to the phone shell.
- `src/hooks/`: `useWindowManager` (wraps the reducer), `useWindowGestures` (pointer and keyboard move/resize), `useFocusReturn` (dialog focus handoff), `useIsMobile`, `useTheme` (light/dark, persisted), `useNow` (phone clock), `useTextDocument` (editor document and local draft), `useWeather` (forecast request) and `useWeatherPrefs` (saved city and unit).
- `src/data/`: apps, tools, windows (default geometry), profile (the single source for bio and contact copy and the years figure), terminal content, `desktopDemo` (placeholder Files and Viewer content), `quickSettings`, `icons`. Pure data and pure helpers.
- `src/styles/`: three layers. `orchis.tokens.css` is GENERATED from the Orchis DS at the commit in `orchis.manifest.json` (never edit it; `tokens:check` fails on drift). `site.tokens.css` holds fa-www's own values and overrides and loads second; `site.light.tokens.css` loads third and applies the light theme under `data-theme="light"`. Component CSS (`desktop.css`, `mobile.css`, `form.css`, `terminal.css`, `app-icon.css`, `tools-grid.css`, `content.css`, `base.css`) reads tokens only.
- `src/lib/`: pure, unit-tested logic. `windowManager.js` (`windowReducer`), `windowGeometry.js` (clamping, keyboard gesture math), `layout.js` (layout tokens, tiling), `terminal/TerminalEngine.js` (class with `#cwd`, a `Map` command registry, injected deps, `execute(raw)` returning `{ lines, effects }`), `terminal/path.js`, `terminal/history.js`, `keyboard.js`, `theme.js`, `calculator.js`, `zoom.js`, `clock.js`, `textEditor.js` (cursor, counts, file names, draft storage), `fileDownload.js` (injected download), `weather/` (codes, forecast parsing and fetch, city search, saved prefs), `config.js`.
- `scripts/`: `tokens.mjs` (token sync and check), `deploy.sh` (CI deploy, env-driven, `DRY_RUN=1`), `activate-release.sh` (host-side release switch; piped over ssh), `csp-hashes.mjs` (`npm run csp:hashes`, prints the CSP hashes of the built page).
- `docs/decisions/`: short decision records (client:only shell, robots and noindex, iframe sandbox, keyboard policy, inline-style exception, make-private runbook). Add one when you change any of those, and update CLAUDE.md in the same PR when files move.
- `tests/unit/`: Vitest + Testing Library. `tests/e2e/`: Playwright + axe.

## Delivery

Monitoring, the shared-config copy policy and the Uptime Kuma checks are in `docs/monitoring.md`. Keep its tool table in step with `src/data/tools.js`.

CI builds once and uploads the `dist` artifact; the deploy job (push to `main` only, `environment: production`) downloads that exact artifact and `scripts/deploy.sh` rsyncs it to `releases/<sha>/` on the host, then switches the `current` symlink atomically. Rollback is one command: `docs/rollback.md`. The proposed Caddy block and CSP, with the host migration steps, are in `docs/caddy/Caddyfile.proposed.md`. After any Astro upgrade run `npm run build && npm run csp:hashes` and update the hashes in that doc; `tests/e2e/csp.spec.js` fails when they drift. If you change `PUBLIC_TOOLS_ORIGIN`, `PUBLIC_CONTACT_ENDPOINT`, `PUBLIC_WEATHER_ORIGIN` or `PUBLIC_GEOCODING_ORIGIN`, change `frame-src` or `connect-src` in the same doc.

## Build-time configuration

Read through `src/lib/config.js` (never `import.meta.env` directly in components). All variables are optional and default to the production values, so no deploy config is required:

- `PUBLIC_CONTACT_ENDPOINT`: contact form target (default `https://contact-api.jrflab.dev/contact`).
- `PUBLIC_TOOLS_ORIGIN`: origin that serves the tool pages (default `https://portfolio.faysalahmed.ca`).
- `PUBLIC_WEATHER_ORIGIN`: forecast API origin for the Weather app (default `https://api.open-meteo.com`).
- `PUBLIC_GEOCODING_ORIGIN`: city search API origin (default `https://geocoding-api.open-meteo.com`).

## Conventions

- Never push to `main`. Merging to `main` deploys production. Work on a branch and open a PR.
- ES modules, `const` by default, no `var`, no `console.*` of any kind (lint error, no allowances).
- Do not widen a lint ignore or inline disable without a comment giving the reason and the plan item that removes it.
- No inline styles and no inline event handlers (`react/forbid-dom-props` enforces the first). One documented exception: `Window.jsx` may set `style` to CSS custom properties for runtime window geometry only (`--window-x`, `--window-y`, `--window-width`, `--window-height`, `--window-z`). All skin stays in CSS, and an e2e test fails on any other inline declaration.
- No hex colors outside `orchis.tokens.css`, `site.tokens.css` and `site.light.tokens.css` (Stylelint for CSS, an ESLint rule for `src/**/*.js`). Components refer to tokens, for example `--app-tone-*` for app icon colors.
- New CSS uses BEM class names (`.terminal__line--input`). Every transition goes through the `--transition*` tokens, which `site.tokens.css` turns off under `prefers-reduced-motion`.
- Fonts are self-hosted through `@fontsource` packages; do not add a Google Fonts import.
- Known defects are pinned with `it.fails` / `test.fixme`. When you fix one, delete its marker in the same commit. None are pinned right now.
- Window state changes go through `windowReducer` actions; the reducer never reads the DOM (screen size arrives in the action). The terminal engine returns effects instead of performing them.
- Tool frames keep the `TOOL_FRAME` sandbox flags in `src/data/tools.js`. Do not drop `allow-same-origin`: the e2e test shows module scripts then fail without CORS headers on the host.
- Bio and contact copy, and the years figure, come from `src/data/profile.js`. Never hardcode them in a component. No phone number or street address belongs in this repo.
- `src/data/tools.js` mirrors fa-portfolio by hand. Do not import from that repo.
- Secrets and hostnames live in repository secrets, never in workflow files.
