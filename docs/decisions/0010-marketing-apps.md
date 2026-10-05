# 0010: Marketing tools as individual apps

Status: accepted. Implemented in `src/data/marketingTools.js`, `src/data/folders.js` and `src/components/FolderContent.jsx`. The pages live in fa-portfolio (`public/marketing/`, its decision 0007).

## Decision

- A Marketing folder (desktop icon, dock button, phone home icon) holds 21 tiles in six groups. Each tile is an app: it opens one tool in its own window (full screen on the phone), with its own glyph, a group color, and its own dock button while open. `open marketing` and `open <slug>` work in the terminal.
- The tools are standalone pages on the portfolio origin at `/marketing/<slug>.html`, shown through the same sandboxed iframe as the five Astro tools. They are not copied into this repo, so www keeps its strict CSP and `frame-src` does not change. `src/data/marketingTools.js` mirrors the file list by hand.
- The Tools and Marketing folders share one component and one registry (`data/folders.js`), so a third folder is data, not code.
- Marketing frames use `MARKETING_FRAME`: the tool sandbox plus `allow-modals` (Print or save PDF needs it) and `allow="clipboard-write"` (copy buttons). `allow-same-origin` stays, and the frames still get no top navigation, popups or forms. The pages are on another origin from www and carry `connect-src 'none'` on the host, so neither grant can send data anywhere. The five portfolio tools keep `TOOL_FRAME` unchanged.
- The pages keep their own look and their own light/dark switch. They do not follow the www theme.

## Why not host them here

They use inline scripts and styles. Serving them from www would need `unsafe-inline` on the www policy or a Caddy exception on the www origin, and a same-origin frame with `allow-same-origin` can remove its own sandbox. The portfolio origin is a different origin, already framed by www, and gets its own policy for `/marketing/*`.

## Trade-offs

- A tool shows an empty frame, then the "did not load" notice, if the portfolio host is down or its `/marketing/*` rule is not deployed. The "Open in a new tab" link stays.
- Inputs a visitor saves in a tool live in portfolio-origin `localStorage` (keys start with `mt:`), not in www.
- Terminal `ls tools` still lists only the five Astro tools.

## What would change it

A wish for the tools to follow the www theme (rebuild them with the Orchis tokens, or pass the theme in the URL), or a tool that needs the network.
