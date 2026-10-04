# CLAUDE.md

Astro 4 static site, React 18 island. See `docs/architecture.md` for the current design.

## Commands

- `npm run check`: lint, format check, typecheck, unit tests. Run before every commit.
- `npm run build` then `npm run test:e2e`: Playwright serves `astro preview`. Set `PW_CHROMIUM_PATH` to an existing Chromium binary when Playwright's own download is unavailable.
- `npm run lint:fix`, `npm run format`.

## Repo map

- `src/components/`: React components. `Desktop.jsx` switches shells; content components are shared by both.
- `src/data/`: apps, tools, terminal content. Pure data and pure helpers.
- `src/styles/`: CSS. `tokens.css` is vendored; do not edit or reformat it.
- `tests/unit/`: Vitest + Testing Library. `tests/e2e/`: Playwright + axe.

## Conventions

- Never push to `main`. Merging to `main` deploys production. Work on a branch and open a PR.
- ES modules, `const` by default, no `var`, no `console.log`.
- Do not widen a lint ignore or inline disable without a comment giving the reason and the plan item that removes it.
- No new inline styles or inline event handlers. Existing ones are tracked for removal in refactor Phase 3 and Phase 4.
- Known defects are pinned with `it.fails` / `test.fixme`. When you fix one, delete its marker in the same commit.
- `src/data/tools.js` mirrors fa-portfolio by hand. Do not import from that repo.
- Secrets and hostnames live in repository secrets, never in workflow files.
