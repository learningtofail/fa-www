# fa-www build history (frozen)

Phase-by-phase log moved out of the README. Describes how the site was built, not its current state; see `architecture.md` for the current state.

Astro project for `www.faysalahmed.ca`. Static output, one large React island (`Desktop.jsx`) for the window manager and terminal — everything else is presentational.

## What's here (Phase 6 + Phase 7 delivery)

Two genuinely separate shells, not one responsive layout: a GNOME-style desktop simulator and an Android-style mobile shell, swapped at runtime by viewport.

- **`src/components/Desktop.jsx`** — thin switcher. `useIsMobile()` (`src/hooks/useIsMobile.js`, a live `matchMedia("(max-width: 768px)")` listener) decides which shell to render, live — resizing a browser window across 768px swaps shells without a page reload, verified with Playwright in both directions.
- **`src/components/DesktopShell.jsx`** (`src/styles/desktop.css`) — GNOME-style desktop: fixed top bar (`TopBar.jsx`) with an Activities button, live clock, and decorative system tray icons; a top-left desktop icon grid (About/Contact/Now/Tools); floating draggable/resizable windows (`Window.jsx`) for everything, including a new **Tools folder window**; a floating rounded dock with icon buttons for every open app plus Terminal. "Activities" tiles all open, non-minimized windows into a computed grid. Chrome is skinned after the **Orchis GTK theme** (dark variant, default blue accent): flat `#363636` window titlebars, circular flat window buttons, rounded window/dock corners, and a `dash-to-dock`-style floating dock rather than a full-width bar — all as CSS custom properties (`--orchis-accent`, `--orchis-chrome-elevated`, `--orchis-radius`) at the top of `desktop.css`, so the accent color or radius can be swapped in one place. The wallpaper gradient is unrelated to the GTK theme and was left as-is. Mobile is unaffected — Orchis is a desktop-GTK concept and doesn't map to the Android shell.
- **`src/components/MobileShell.jsx`** (`src/styles/mobile.css`) — Android-style mobile: a full-screen icon grid (all five apps, Terminal included — no dock on mobile), a **Tools folder** that opens as a centered popup overlay instead of a window, and full-screen app views (with a back button) for About/Contact/Now/Terminal/tool iframes. No system status bar — the phone already has one.
- **`src/data/apps.js`** — single registry of app metadata (id/label/glyph/color/kind) shared by both shells' icon grids and the dock, so desktop and mobile can't drift on what apps exist. `DESKTOP_ICON_APPS` excludes Terminal (dock-only on desktop); mobile's grid uses the full list.
- **`src/components/Window.jsx`** — window chrome: drag via title bar, resize via corner handle, close/minimize, click-to-focus z-index ordering. Pure interaction component; all state lives in `DesktopShell.jsx`.
- **`src/components/AboutContent.jsx`, `ContactContent.jsx`, `NowContent.jsx`, `IframeContent.jsx`, `ToolsFolderContent.jsx`** — pure content components with no window-chrome assumptions baked in, which is why both shells can reuse them unmodified (windows on desktop, full-screen views or popups on mobile).
- **`src/components/ContactContent.jsx`** — a real form (name/email/message + hidden honeypot), posts to `https://contact-api.jrflab.dev/contact` per the Phase 3 spec. Tested against the (not-yet-live) endpoint — fails gracefully with a visible error message and a "try again or email directly" fallback rather than hanging or crashing.
- **`src/components/Terminal.jsx`** — full command table: `help`, `ls`, `cd [dir]`, `cat [file]`, `open [thing]`, `whoami`, `sudo` (cosmetic easter egg only), `clear`, plus command history via up/down arrows. Boot-line hint (`type 'help' to get started.`) shows on open. Reused as-is inside both a floating window (desktop) and a full-screen app view (mobile).
- **`src/data/terminalContent.js`** — the virtual filesystem (`about.txt`, `contact.txt`, `tools/`, `.secrets/` with its two easter-egg files) and all flavor text, sourced from the approved copy doc.
- **`src/data/tools.js`** — mirrors the locked slugs from `fa-portfolio`. Two separate repos/domains, so this list is duplicated by hand rather than shared — keep the two in sync if a slug ever changes.

## Phase 9 — Assets

- **Favicon** (`public/favicon.svg` + rasterized PNGs) — a dark tile with a bright-blue `>_` terminal-prompt glyph, matching the terminal's own color scheme. Built directly as SVG, not AI-generated.
- **OG/Twitter card** — `public/og-image.png` (1200×630) is a real Playwright screenshot of the actual live desktop shell (About/Contact/status windows open, Tools folder open) rather than an AI-generated mockup of what the site _might_ look like. More accurate, and avoids the risk of an AI image inventing UI that doesn't match the real site. Meta tags wired into `Base.astro` the same way as `fa-portfolio`. This is what renders when the link is shared in Slack/iMessage/LinkedIn — Phase 8's Cloudflare rule specifically keeps that working.
- **App icon set — prompts drafted, not yet generated.** The current About/Contact/Now/Tools/Terminal icons are emoji glyphs on flat colored tiles (`src/data/apps.js`), explicitly called out as placeholders pending this phase. Per your call, these get replaced with real icon art rather than kept as final — Gemini prompts for a consistent 5-icon set (shared style block + a per-icon subject line, so a Material/Orchis-consistent look survives across five separate generations) are in `phase9-icon-prompts.md`, delivered alongside this zip. Once you generate and send the 5 PNGs back, I'll wire them into `apps.js` and `AppIcon.jsx` (with a fallback to the current glyph rendering so nothing breaks mid-transition) and re-verify both shells.

## Discoverability model changed in Phase 7 — worth flagging explicitly

The original Phase 1 IA framed tool access as terminal-only: no visible links, found by typing `open [slug]` (or `ls tools/`) once someone's poking around. Phase 7's brief ("folders can be used as navigation tools for pages or applications, i.e. the tools we build") makes the **Tools folder a visible icon** on both the desktop icon grid and the mobile home screen, opening a folder window/popup listing all five tools by name. The terminal path still works exactly as before (`ls`, `cd tools/`, `open [slug]`) — this adds a second, GUI-native way in rather than replacing the first. Flagging this since it's an architecture-affecting call, even though it's a direct implementation of your own Phase 7 instruction rather than something I introduced independently.

## Open Item 1 (iframe vs. new tab) — resolved

`open [tool-slug]` (or tapping a tool icon in the Tools folder) opens an `<iframe>` pointed at `portfolio.faysalahmed.ca/tools/[slug]` — a draggable/resizable/closeable window on desktop, a full-screen view on mobile. `open resume` / `open portfolio` is different on purpose: it opens the full site in a new browser tab (`window.open`, not an iframe), since that command is explicitly "leaving" the playful shell rather than staying inside it.

## A hydration bug Phase 7 surfaced, and the fix

`useIsMobile()` reads `window.matchMedia` in its initial state, which meant the first client render on a phone-width viewport didn't match what the server rendered at build time (server has no `window`, so it always rendered the desktop shell) — a real, structural hydration mismatch (React errors #418/#423), not a cosmetic warning. Caught it because the mobile Playwright run logged page errors even though every functional assertion passed. Fixed by switching `<Desktop client:load>` to `<Desktop client:only="react">` in `src/pages/index.astro`: this component never renders server-side at all now, so there's nothing for the client to mismatch against. Given the whole page is a JS-driven shell with no SEO value (already `noindex, nofollow`), skipping SSR for it has no real downside. Added a dark background color on `<body>` in `Base.astro` so the brief pre-hydration window isn't a flash of white. Re-verified both shells and the resize-across-breakpoint test after the fix: zero page errors.

## Verified with Playwright

**Terminal (Phase 6):** every command actually run and its output checked — `help`, `ls` at root and inside `tools/`, `cd` in and out of `tools/` and `.secrets/`, both `.secrets/` files via `cat`, `whoami`, `sudo rm -rf /` (cosmetic, no effect), `cat` on a missing file, an unrecognized command, and `open utm-auditor` (correct iframe URL, correct dock entry). Drag/resize/focus-ordering tested on a window.

**Desktop shell (Phase 7):** live clock rendering, correct desktop icon set (Terminal correctly excluded), 5 dock icons, double-clicking the Tools icon opens a folder window listing all 5 tools by name, clicking a tool inside it opens a correctly-URLed iframe window and adds a dock entry, Activities tiles all open windows into a clean non-overlapping grid, terminal via the dock runs `ls` correctly. Zero page errors.

**Mobile shell (Phase 7):** no GNOME top bar present, all 5 app icons on the home grid (Terminal included), tapping About opens a correct full-screen view, back button returns to the grid, tapping Tools opens the folder popup, tapping a tool inside it opens a correct full-screen iframe view, Terminal opens full-screen and `whoami` produces the correct output. Zero page errors (see hydration fix above).

**Live resize (Phase 7):** started at desktop width, confirmed `.gnome-root` present; shrank across 768px, confirmed it's replaced by `.android-root` with no reload; grew back, confirmed it swaps back to `.gnome-root`. Zero page errors in either direction.

## Phase 8 — Bot blocking

`robots.txt` (`Disallow: /`) and `<meta name="robots" content="noindex, nofollow">` were already in place from Phase 6 (verified again here, unchanged). Two more layers still need your `ganesha`/Cloudflare access to apply — an `X-Robots-Tag` HTTP header at the Caddy level (covers non-HTML responses `robots.txt`/the meta tag don't) and the actual bot-blocking enforcement (Super Bot Fight Mode + a WAF rule that exempts link-preview bots so Slack/iMessage/LinkedIn unfurls still work) — both are copy-paste ready in `phase8-infra-config.md`, delivered alongside this zip.

## Phase 8 — Accessibility (documented best-effort, not full AA)

Per the plan, `www` gets a best-effort baseline rather than the full WCAG 2.1 AA set on `portfolio` — the window-manager concept is inherently spatial (drag/resize by mouse) and reproducing that losslessly for keyboard/screen-reader use isn't a realistic goal here. What "best-effort" means concretely, and what's still a known gap:

Fixed:

- **Desktop icons couldn't be opened by keyboard at all.** Opening required a double-click, and double-click has no keyboard equivalent — tabbing to a desktop icon and pressing Enter only "selected" it (native `<button>` click behavior), with no way to actually open the window. Fixed: Enter/Space on a desktop icon now opens directly, matching double-click's effect. (Dock icons were already fine — those open on a single click, which Enter already triggers natively.)
- **Escape now closes the topmost open window** on desktop, so closing something doesn't require precisely hitting a 22px × button — a keyboard affordance layered on top of the existing mouse close button, not a replacement for it.
- **The terminal's scrollback had no live region** — new command output wasn't announced to screen readers unless the user manually re-navigated into it. Fixed with `role="log" aria-live="polite"`, the standard ARIA pattern for exactly this (chat/terminal-style logs).
- **The terminal input had no accessible name and an explicitly removed focus outline** (`outline: none` in the inline styles) — a real, not cosmetic, violation: a keyboard user tabbing away and back would see no visual confirmation of focus. Added `aria-label="Terminal command input"` and a proper `:focus-visible` style (moved to a small dedicated stylesheet, `src/styles/terminal.css`, since `Terminal.jsx` is shared by both shells and needed to work regardless of which one's loaded).
- Added explicit `:focus-visible` rings (accent-colored, matching each shell's palette) to dock icons, desktop icons, the Activities button, mobile app icons, and the mobile back button, on top of whatever the browser already provides by default.

Still a known, documented gap, not fixed here:

- **Window dragging and resizing remain mouse-only on desktop.** No keyboard equivalent for repositioning or resizing a window — this is the one piece of the "best-effort, not full AA" framing that's a genuine, acknowledged limitation rather than an oversight. A keyboard-accessible alternative (e.g., arrow-key nudging while a window has focus) would be real design work, scoped out of Phase 8.
- Mobile's full-screen app views and folder popup don't have this problem — no dragging/resizing exists there in the first place, so mobile's keyboard/screen-reader story is materially better than desktop's by nature of the simpler interaction model.

Verified with Playwright: tabbed to a desktop icon and opened it with Enter alone (no mouse), confirmed Escape closes the topmost window, confirmed the terminal's output region reports `role="log"`/`aria-live="polite"` and the input reports a real `aria-label`, confirmed the input's computed `outline-style` is no longer `none` when focused. Re-ran the full desktop/mobile/resize-breakpoint functional suites afterward — zero regressions, zero page errors.

## Known gaps, by design

- **No unified visual design system beyond the two OS aesthetics** — desktop borrows GNOME conventions, mobile borrows Android conventions, but neither has final icon artwork (glyphs are emoji placeholders) or a real favicon/app-icon set yet — that's Phase 9 (assets).
- **The Now/status window is included**, resolving the "maybe" from the plan in favor of keeping it — it was already drafted in the Phase 2 copy pass. Remove its entry from `src/data/apps.js` and the corresponding branch in `DesktopShell.jsx`/`MobileShell.jsx` if you'd rather cut it.
- **The contact form endpoint isn't live yet** (Phase 3 is specced, not deployed) — tested that failure is handled gracefully; re-verify against the real endpoint once `contact-api.jrflab.dev` is actually up.
- **`src/data/tools.js` is duplicated from `fa-portfolio`**, not imported (separate repos/domains) — if a tool slug changes, it needs updating in both places by hand.
- **`client:only="react"` means the whole shell is blank until JS loads** — a brief dark screen (see hydration fix above) rather than a flash of wrong content. Fine for this site's purpose; worth knowing if a future page on this domain wants real SSR content, since it'd need its own island rather than reusing this pattern.

## Local development

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # outputs to dist/
npm run preview   # serve the built output locally
```

## Deploying to ganesha

This is a new site — no existing placeholder to replace, unlike `fa-portfolio`. Needs, per Phase 11 (not yet executed):

1. A new repo (or a second path in an existing one) for `www.faysalahmed.ca`.
2. A new Cloudflare Tunnel ingress entry for `www.faysalahmed.ca` in `/etc/cloudflared/config.yml`, plus the matching DNS record — same manual-CNAME approach used in Phase 3 to avoid the origin-cert gotcha (see `claude/phase-3-shared-foundations.md`), since `faysalahmed.ca` is the zone the active cert is authorized against, but this is a new hostname under it, not `jrflab.dev` — worth confirming the cert covers new subdomains under the same zone it's already authorized for before assuming this step is a non-issue (I believe it does, since the authorization is zone-level, but I haven't been able to test this against the real tunnel from this session).
3. A build+rsync target under `/opt/static-web` on `ganesha`, separate from `sites/portfolio`.
4. Confirmation the current live WordPress site at this hostname is decommissioned rather than left running in parallel — a separate step from standing this up, per the plan.

None of this is done from this session — I don't have exec or dashboard access to `ganesha`/Cloudflare. This is Phase 11 work once you're ready for it.
