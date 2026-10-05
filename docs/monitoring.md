# Monitoring and shared concerns

fa-www and fa-portfolio share nothing at build time. This page lists what ties them together at runtime and how each tie is watched.

## Runtime coupling

The Tools folder in www opens pages from `https://portfolio.faysalahmed.ca/tools/<slug>/` in a sandboxed iframe (`src/data/tools.js`). A portfolio outage or a renamed slug degrades that one feature, not the site: every tool window keeps an "Open in a new tab" link, so users are never stuck.

The Marketing folder opens `https://portfolio.faysalahmed.ca/marketing/<slug>.html`. Those 21 pages are monitored from the fa-portfolio side (`docs/monitoring.md` there); `src/data/marketingTools.js` is a hand-kept mirror of the file list.

`src/data/tools.js` is a hand-kept mirror of the slug list in fa-portfolio. There is no build or CI link, so drift is caught by monitoring, not by a test.

## Uptime Kuma: one keyword monitor per tool

Add five monitors of type **HTTP(s) - Keyword**, interval 300 s, retries 2, notify the usual channel. The keyword is the page's `<h1>`, which is in the static HTML, so no JavaScript is needed. A 404 after a slug change, an empty deploy or an outage on the portfolio host all fail the check.

| Monitor name                       | URL                                                        | Keyword                       |
| ---------------------------------- | ---------------------------------------------------------- | ----------------------------- |
| `portfolio tool: utm-auditor`      | `https://portfolio.faysalahmed.ca/tools/utm-auditor/`      | `UTM Governance Auditor`      |
| `portfolio tool: gtm-auditor`      | `https://portfolio.faysalahmed.ca/tools/gtm-auditor/`      | `GTM Container Auditor`       |
| `portfolio tool: cac-calculator`   | `https://portfolio.faysalahmed.ca/tools/cac-calculator/`   | `Payback Calculator`          |
| `portfolio tool: attribution`      | `https://portfolio.faysalahmed.ca/tools/attribution/`      | `Multi-Touch Attribution`     |
| `portfolio tool: disclosure-check` | `https://portfolio.faysalahmed.ca/tools/disclosure-check/` | `Disclosure Language Checker` |

The www site itself has its own monitor, `www.faysalahmed.ca (keyword)`, described in `docs/rollback.md`.

When a tool monitor alerts after you changed fa-portfolio, update the `slug` or `name` in `src/data/tools.js` and the matching row here.

## Tokens

Both sites pin the same Orchis design-system commit and run `npm run tokens:check` against it. The `static` job in `.github/workflows/ci.yml` runs it with `--require-network`, so a drifted vendored file or an unreachable DS repo fails CI instead of passing offline. The DS repo is the only shared source. Keep it public, or the pinned check needs a credential.

## Shared config: copy, do not extract

ESLint, Prettier, `tsconfig`, Stylelint and the deploy workflow are copied between repos by hand. Extract a shared-config repo (or `learningtofail/.github` for workflows) only when a third site adopts them. Two consumers do not justify a third repository. When you change one of these files here, make the same change in fa-portfolio in the same sitting.
