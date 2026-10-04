# fa-www

Source for `www.faysalahmed.ca`: an Astro static site with one React island that simulates a GNOME desktop (wide viewports) or an Android home screen (narrow viewports).

```bash
npm ci
npm run dev        # http://localhost:4321
npm run check      # lint + format:check + typecheck + unit tests
npm run build      # outputs to dist/
npm run test:e2e   # Playwright against the built site (needs a Chromium; see CLAUDE.md)
```

Requires Node >= 22.12 (`.nvmrc`). Merging to `main` deploys to production through GitHub Actions.

- Contributor and agent guide: [CLAUDE.md](CLAUDE.md)
- Current architecture: [docs/architecture.md](docs/architecture.md)
- How the site was built, phase by phase: [docs/history.md](docs/history.md)
