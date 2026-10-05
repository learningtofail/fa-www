# 0001: The desktop shell is `client:only`

Status: accepted.

## Decision

`src/pages/index.astro` renders `<Desktop client:only="react" />`. The server never renders the shell.

## Why

Which shell to show (desktop or mobile) depends on `matchMedia("(max-width: 768px)")`, which does not exist at build time. Server-rendering either shell would flash the wrong one on the other kind of device, and hydration workarounds add code for no benefit on a site that is not indexed (see 0002).

## Consequences

- The initial HTML holds no desktop UI. The `<noscript>` block carries the About and Contact text so the page still says something without JavaScript; `tests/e2e/phase4.spec.js` pins it.
- First paint waits for the island bundle. Acceptable for a small static site.
- Window and terminal state live in React and are lost on reload by design.

## What would change it

Needing the site indexed, or a measurable first-paint problem. Then render a neutral shell on the server and pick the layout after hydration.
