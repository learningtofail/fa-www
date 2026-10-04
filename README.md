# fa-www

Source for `www.faysalahmed.ca`: an Astro static site with one React island that simulates a GNOME desktop (wide viewports) or an Android home screen (narrow viewports).

```bash
npm ci
npm run dev        # http://localhost:4321
npm run check      # lint, Stylelint, tokens, format, typecheck, unit tests + coverage
npm run build      # outputs to dist/
npm run test:e2e   # Playwright against the built site (needs a Chromium; see CLAUDE.md)
```

Requires Node >= 22.12 (`.nvmrc`). Merging to `main` deploys to production through GitHub Actions.

- Contributor and agent guide: [CLAUDE.md](CLAUDE.md)
- Current architecture: [docs/architecture.md](docs/architecture.md)
- Decision records and the make-private runbook: [docs/decisions/](docs/decisions/README.md)
- Rollback and Caddy config: [docs/rollback.md](docs/rollback.md), [docs/caddy/Caddyfile.proposed.md](docs/caddy/Caddyfile.proposed.md)
- Monitoring: [docs/monitoring.md](docs/monitoring.md)
- How the site was built, phase by phase: [docs/history.md](docs/history.md)
