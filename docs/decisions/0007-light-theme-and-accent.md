# 0007: Light Orchis theme, accent color and the phone status bar

Status: accepted. Implemented in `src/styles/site.light.tokens.css`, `src/lib/theme.js`, `src/hooks/useTheme.js`, `src/components/QuickSettings.jsx` and `MobileStatusBar.jsx`.

## Decision

- The site ships a light Orchis variant on top of the dark shell. Light is the default. `data-theme` on `<html>` switches `site.light.tokens.css` on, and Quick Settings, Dark Style flips it. The choice persists in `localStorage["fa-www:theme"]`. If storage is blocked the site falls back to `DEFAULT_THEME`.
- In the light theme `--primary` is stock Orchis `#1A73E8` (fills, buttons, toggles). Text links use `--link: #1558b0`, the review-D5 blue, because `#1A73E8` is 4.50:1 on white but 4.02:1 on the grey bars inside windows (axe caught this on the tool frame's "open in new tab" link). The dark theme keeps the D5 values throughout.
- The phone shell now has a status bar. This reverses the old `mobile.css` note that the Android shell has no system bar on purpose. The whole bar is one button that opens the Quick Settings sheet.
- Only Dark Style does anything in Quick Settings. Wired, Night Light, Caffeine and the volume slider are cosmetic. `src/data/desktopDemo.js` holds placeholder content for Files and Weather and the Image Viewer picture.

## Why

The redesign calls for the stock Orchis light look. WCAG AA contrast is not negotiable (AODA), so the accent split keeps the design's blue where it carries no small text and the reviewed blue where it does. `tests/unit/contrast.test.js` pins the light-theme pairs, and `tests/e2e/redesign.spec.js` runs axe in both themes.

## What would change it

Replace placeholder content with real content, or delete the apps. If a lighter surface behind links is introduced, re-run the contrast tests. If Orchis ships an accent with 4.5:1 on its own grey surfaces, drop the `--link` override.
