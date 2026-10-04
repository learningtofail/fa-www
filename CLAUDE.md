# CLAUDE.md

Astro 4 static site, React 18 island. See `docs/architecture.md` for the current design.

## Commands

- `npm run check`: lint, format check, typecheck, unit tests. Run before every commit.
- `npm run build` then `npm run test:e2e`: Playwright serves `astro preview`. Astro 7 `preview` backgrounds itself in non-TTY shells, so the Playwright config passes `--ignore-lock` to keep it in the foreground. Set `PW_CHROMIUM_PATH` to an existing Chromium binary when Playwright's own download is unavailable.
- `npm run lint:fix`, `npm run format`.
- `npm run lint:css`: Stylelint (`color-no-hex`, no `!important`) on `src/**/*.{css,astro}`.
- `npm run tokens:check`: rebuilds the vendored Orchis tokens from the pinned DS commit and diffs them. Offline it falls back to the recorded sha256; CI runs it with `--require-network`. `npm run tokens:sync` rewrites the vendored file after you change the pin in `src/styles/orchis.manifest.json`.

## Repo map

- `src/components/`: React components. `Desktop.jsx` switches shells; content components are shared by both.
- `src/data/`: apps, tools, terminal content. Pure data and pure helpers.
- `src/styles/`: three layers. `orchis.tokens.css` is GENERATED from the Orchis DS at the commit in `orchis.manifest.json` (never edit it; `tokens:check` fails on drift). `site.tokens.css` holds fa-www's own values and overrides and loads second. Component CSS (`desktop.css`, `mobile.css`, `form.css`, `terminal.css`, `app-icon.css`, `tools-grid.css`, `content.css`, `base.css`) reads tokens only.
- `src/lib/`: pure, unit-tested logic (`terminal/path.js`, `windowGeometry.js`, `layout.js`, `keyboard.js`, `config.js`). `layout.js` reads layout tokens at runtime.
- `scripts/`: `tokens.mjs` (token sync and check).
- `tests/unit/`: Vitest + Testing Library. `tests/e2e/`: Playwright + axe.

## Build-time configuration

Read through `src/lib/config.js` (never `import.meta.env` directly in components). `PUBLIC_CONTACT_ENDPOINT` overrides the contact form target and defaults to the production API, so no deploy config is required.

## Conventions

- Never push to `main`. Merging to `main` deploys production. Work on a branch and open a PR.
- ES modules, `const` by default, no `var`, no `console.*` of any kind (lint error, no allowances).
- Do not widen a lint ignore or inline disable without a comment giving the reason and the plan item that removes it.
- No inline styles and no inline event handlers (`react/forbid-dom-props` enforces the first). One documented exception: `Window.jsx` may set `style` to CSS custom properties for runtime window geometry only (`--window-x`, `--window-y`, `--window-width`, `--window-height`, `--window-z`). All skin stays in CSS, and an e2e test fails on any other inline declaration.
- No hex colors outside `orchis.tokens.css` and `site.tokens.css` (Stylelint for CSS, an ESLint rule for `src/**/*.js`). Components refer to tokens, for example `--app-tone-*` for app icon colors.
- New CSS uses BEM class names (`.terminal__line--input`). Every transition goes through the `--transition*` tokens, which `site.tokens.css` turns off under `prefers-reduced-motion`.
- Fonts are self-hosted through `@fontsource` packages; do not add a Google Fonts import.
- Known defects are pinned with `it.fails` / `test.fixme`. When you fix one, delete its marker in the same commit.
- `src/data/tools.js` mirrors fa-portfolio by hand. Do not import from that repo.
- Secrets and hostnames live in repository secrets, never in workflow files.
