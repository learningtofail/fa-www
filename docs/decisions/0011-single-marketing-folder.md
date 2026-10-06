# 0011: One Marketing folder, no Tools folder

Status: accepted. Pairs with fa-portfolio decision 0008, which retires the UTM, GTM and CAC Astro tools.

## Decision

- The Tools folder (desktop icon, dock button, phone home icon, `tools` window) is removed. The two Astro tools that stayed, Multi-Touch Attribution and Disclosure Language Checker, are tiles in the Marketing folder: Attribution in "Experimentation and measurement", Disclosure Checker in "Messaging and compliance".
- `data/marketingTools.js` is the only tool catalog (23 entries). An entry with a `path` is an Astro page at `/tools/<slug>/` and uses `TOOL_FRAME`; an entry without one is a vendored page at `/marketing/<slug>.html` and uses `MARKETING_FRAME`. `data/tools.js` keeps only the frame constants.
- The terminal lists and opens all 23 slugs (`ls tools`, `open <slug>`). The `extraTools` dependency is gone: one list, one `toolUrl`.
- Old www state has no saved window geometry for `tools`, so nothing migrates.

## Why

The three removed Astro tools had marketing equivalents, so two folders held overlapping tools. One folder is one place to look. The Astro pages keep their own origin path and stricter frame, so grouping them changes navigation only, not isolation.

## What would change it

A tool that does not fit a marketing group, or enough non-marketing tools to justify a second folder: add it to `data/folders.js`.
