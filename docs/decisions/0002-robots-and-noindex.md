# 0002: robots.txt, noindex meta and X-Robots-Tag

Status: accepted. The header half is delivered by the Caddy proposal in `docs/caddy/Caddyfile.proposed.md`.

## Decision

Three layers, all kept:

1. `public/robots.txt`: `User-agent: *` and `Disallow: /`.
2. `<meta name="robots" content="noindex, nofollow">` in `src/layouts/Base.astro`.
3. `X-Robots-Tag: noindex, nofollow` as a response header from Caddy.

Cloudflare WAF blocks bad bots separately and exempts link-preview bots, so the Open Graph tags in `Base.astro` still render when the URL is shared.

## Why: Disallow does not mean noindex

`Disallow: /` stops compliant crawlers from fetching the page, which means they never see the `noindex` meta tag. A URL that is linked from elsewhere can still appear in search results as a bare URL, with no snippet. So robots.txt alone does not keep a page out of an index, and the meta tag only matters for crawlers that reach the page some other way. The `X-Robots-Tag` header works on any fetch regardless of how the crawler got there, so it is the layer that closes the gap. Keep all three: they fail differently.

## What would change it

Wanting the site found. Remove all three together, then lift the WAF rule.
