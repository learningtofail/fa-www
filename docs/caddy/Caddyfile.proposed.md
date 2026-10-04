# Proposed Caddy config for www.faysalahmed.ca

Status: **proposal, not applied.** This file holds the complete site block for www plus the exact host-side steps. The PR that carries it (phase 5) must not be merged until step 6 is done.

Assumptions, verify each against the live host before you start:

- Caddy runs on the static host (`ganesha` per the READMEs) and serves www over plain HTTP behind the Cloudflare tunnel, so the site address is `http://www.faysalahmed.ca`. If your live block uses another address or `bind`, keep your listener lines and change only `root` and the header lines.
- The site root is `/opt/static-web/sites/www`.
- `admin off` may be set, in which case Caddy needs a restart instead of a reload **[U]**.

## The site block

```caddyfile
# www.faysalahmed.ca: static site, atomic releases, security headers.
# `current` is a symlink maintained by scripts/activate-release.sh (see docs/rollback.md).
http://www.faysalahmed.ca {
	root * /opt/static-web/sites/www/current
	encode zstd gzip

	header {
		-Server
		X-Content-Type-Options "nosniff"
		Referrer-Policy "strict-origin-when-cross-origin"
		X-Robots-Tag "noindex, nofollow"
		X-Frame-Options "DENY"
		Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()"

		# Phase 1 of the CSP rollout: report only. Nothing is blocked; violations show in the
		# browser console as "[Report Only]". After a clean week, comment this line out and
		# uncomment the enforcing line below it.
		Content-Security-Policy-Report-Only "default-src 'none'; script-src 'self' 'sha256-Ya0pUYrC7nM5Cn/056TyVuEiz6dFGrzmkWzgON0pF0U=' 'sha256-eIXWvAmxkr251LJZkjniEK5LcPF3NkapbJepohwYRIc='; style-src 'self' 'sha256-vv9IoKo7BSLbWcUHr3tNmfNVmm5L/9Cfn2H6LMk7/ow='; img-src 'self' data:; font-src 'self' data:; connect-src https://contact-api.jrflab.dev; frame-src https://portfolio.faysalahmed.ca; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'"
		# Content-Security-Policy "default-src 'none'; script-src 'self' 'sha256-Ya0pUYrC7nM5Cn/056TyVuEiz6dFGrzmkWzgON0pF0U=' 'sha256-eIXWvAmxkr251LJZkjniEK5LcPF3NkapbJepohwYRIc='; style-src 'self' 'sha256-vv9IoKo7BSLbWcUHr3tNmfNVmm5L/9Cfn2H6LMk7/ow='; img-src 'self' data:; font-src 'self' data:; connect-src https://contact-api.jrflab.dev; frame-src https://portfolio.faysalahmed.ca; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'"
	}

	# Hashed build output never changes under the same name.
	@assets path /_astro/*
	header @assets Cache-Control "public, max-age=31536000, immutable"

	# Everything else must revalidate, so switching `current` is visible on the next request.
	@pages not path /_astro/*
	header @pages Cache-Control "no-cache"

	file_server
}
```

## How the CSP handles Astro's inline scripts

The page has two inline `<script>` blocks (the island bootstrap) and one inline `<style>` (`astro-island{display:contents}`). They are identical between builds of the same Astro version, so the policy allows them by SHA-256 hash instead of `'unsafe-inline'`. Everything else loads from `'self'`.

- Check the hashes after any Astro upgrade: `npm run build && npm run csp:hashes`. If they differ from the block above, update both CSP lines here.
- `tests/e2e/csp.spec.js` extracts the policy from this file, serves the built `dist/` with it as an _enforcing_ header, and exercises the shell, the terminal, a tool window and the contact form. It fails on any CSP violation and when the hashes here no longer match the build. CI therefore catches a stale hash before it reaches the host.
- React sets window geometry through the CSSOM (`style.setProperty`), which a CSP does not block, so no `style-src-attr` allowance is needed.
- `frame-src` must name the origin that `PUBLIC_TOOLS_ORIGIN` points at (default `https://portfolio.faysalahmed.ca`). `connect-src` must name the contact API (`PUBLIC_CONTACT_ENDPOINT`, default `contact-api.jrflab.dev`). Change either variable, change the matching source here.
- `X-Frame-Options: DENY` and `frame-ancestors 'none'` say nobody may embed www. The reverse direction is the portfolio's job: its site block needs `frame-ancestors https://www.faysalahmed.ca` (and nothing broader) so the Tools window can frame it. That header belongs in the fa-portfolio proposal, not here.

RISK: a wrong CSP blanks the shell, and a wrong `root` serves 404 until you revert the line. Both roll back the same way: restore the previous Caddyfile and restart (or reload) Caddy. The CSP starts as Report-Only so the first mistake cannot blank anything.

## Host migration (do these in order, before merging the PR)

Run on the static host as the deploy user unless a step says otherwise. Steps 1 and 4 are designed so the live site never changes while you work.

**1. Create the release layout, keeping the live files serving.**

```bash
cd /opt/static-web/sites/www
mkdir -p releases/legacy
rsync -a --exclude='/releases/' --exclude='/current' ./ releases/legacy/
test -s releases/legacy/index.html && echo "legacy copy ok"
ln -s releases/legacy current
readlink current            # expect: releases/legacy
```

**2. Check ownership.** The deploy user must own `releases/`; the web server user only needs read access.

```bash
ls -ld releases releases/legacy
bash -s -- check /opt/static-web/sites/www < /path/to/checkout/scripts/activate-release.sh   # expect: layout ok
```

**3. Create the `SSH_KNOWN_HOSTS` repository secret.** From a machine on the tailnet that you trust, using the same host name as the `SSH_HOST` secret:

```bash
ssh-keyscan -t ed25519 "$SSH_HOST_NAME" > known_hosts.candidate
ssh-keygen -lf known_hosts.candidate                       # fingerprint as seen over the network
# On the host itself, confirm it matches:
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
gh secret set SSH_KNOWN_HOSTS --repo learningtofail/fa-www < known_hosts.candidate
rm known_hosts.candidate
```

The first column of the line must equal the host name in `SSH_HOST`, or OpenSSH will not match it. Until this secret exists the deploy job stops with "SSH_KNOWN_HOSTS secret is empty" instead of connecting.

**4. Point Caddy at `current`, then validate and apply.** Replace only the site block (and keep Report-Only for now). Contents are unchanged because `current` still points at the copy from step 1.

```bash
sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak-$(date +%F)
sudoedit /etc/caddy/Caddyfile                              # paste the site block above
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy || sudo systemctl restart caddy
```

**5. Verify the host serves the symlinked copy with the new headers.**

```bash
readlink /opt/static-web/sites/www/current                 # releases/legacy
curl -sI https://www.faysalahmed.ca/ | grep -iE '^(HTTP|content-security|x-content-type|referrer-policy|x-robots|x-frame|cache-control)'
curl -s https://www.faysalahmed.ca/ | grep -o 'making Google behave' | head -n 1
```

Open the site in Chromium with DevTools and confirm the console shows no `[Report Only]` violations. Add the Uptime Kuma keyword check from `docs/rollback.md` now, so you see any problem the moment it happens.

**6. Dry-run the deploy, then merge.** From your checkout, on the tailnet (the secrets below are the same values CI uses):

```bash
npm run build
DRY_RUN=1 RELEASE_ID="$(git rev-parse HEAD)" DEPLOY_HOST="$SSH_HOST" DEPLOY_USER="$SSH_USER" \
  SSH_KEY_FILE=~/.ssh/deploy_key SSH_KNOWN_HOSTS_FILE=known_hosts bash scripts/deploy.sh
```

It must print `layout ok`, an rsync preview into `releases/<sha>/`, and "dry run, stopping before activation". Then merge the phase 5 PR. The deploy job writes `releases/<sha>/`, switches `current`, and keeps the last five.

**7. After the first real deploy.**

```bash
ssh deployer@HOST 'bash -s -- list /opt/static-web/sites/www' < scripts/activate-release.sh
curl -sI https://www.faysalahmed.ca/ | head -n 1
```

When you are satisfied, remove the pre-migration files that still sit directly in `/opt/static-web/sites/www/` (everything except `releases` and `current`). They are no longer served; `releases/legacy` holds the copy and ages out after five newer releases.

**8. Enforce the CSP (a week later).** In the Caddyfile, comment out the `Content-Security-Policy-Report-Only` line and uncomment the enforcing one, then validate and reload as in step 4. Verify with `curl -sI https://www.faysalahmed.ca/ | grep -i content-security` and load the site once in a browser. To undo, swap the two lines back.

## Rollback of this config

Restore the backup and apply it:

```bash
sudo cp /etc/caddy/Caddyfile.bak-<date> /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile && sudo systemctl restart caddy
```
