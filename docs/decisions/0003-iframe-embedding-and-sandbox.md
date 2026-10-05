# 0003: Tool iframes and sandbox flags

Status: accepted. Flags live in `TOOL_FRAME` in `src/data/tools.js`.

## Decision

The two Astro tools in the Marketing folder open `https://portfolio.faysalahmed.ca/tools/<slug>/` (origin from `PUBLIC_TOOLS_ORIGIN`) in an iframe with:

`sandbox="allow-scripts allow-same-origin allow-downloads"`, `referrerpolicy="strict-origin"`, `loading="lazy"`.

Every tool window also shows an "Open in a new tab" link, so a blocked frame is never a dead end.

## Why these flags

- `allow-scripts`: the tools are JavaScript apps.
- `allow-same-origin`: without it the frame gets an opaque origin, and its module scripts are fetched with `Origin: null`, which fails unless the portfolio host sends CORS headers. The flag keeps the tool on the portfolio origin, not www's, so it does not expose www. `tests/e2e/phase4.spec.js` proves both halves against a real cross-origin server with no CORS headers.
- `allow-downloads`: the tools export CSV.

Not granted: top navigation, popups, modals, forms, pointer lock, presentation.

`allow-scripts` together with `allow-same-origin` lets a frame remove its own sandbox, but only for content on the portfolio origin, which is first-party. Do not point `PUBLIC_TOOLS_ORIGIN` at an origin you do not control.

## Both directions must allow it

- www CSP: `frame-src` names the portfolio origin.
- portfolio response: `frame-ancestors https://www.faysalahmed.ca`, nothing broader. This is the portfolio's side of the change and is not applied by this repo.

## What would change it

A tool that needs popups or forms: add one flag, add a test, update this record.
