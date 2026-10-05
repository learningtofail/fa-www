# Proposed Caddy config for www.faysalahmed.ca

Status: **proposal, not applied.** This file holds the complete `/etc/caddy/Caddyfile` for the static host plus the exact host-side steps. The Phase 5 PR that carries it must not be merged until steps 0 to 5 are done.

## What the host looks like (verified 2026-10-04)

- The static host is the LXC **`lxc-staticweb`** (container 105 on `srv-saraswati`, LAN `192.168.2.120`, Tailscale `100.66.244.127`). The Cloudflare Tunnel routes both `www.faysalahmed.ca` and `portfolio.faysalahmed.ca` to `http://192.168.2.120:80`. Vinayaki runs the tunnel but does not serve these sites; its own `/opt/static-web` copy is stale and unused for them.
- Caddy runs there as a **systemd service** (`caddy.service`, config `/etc/caddy/Caddyfile`, owned by root). It is not in Docker. The admin API is on (`127.0.0.1:2019`), so `systemctl reload caddy` works.
- One `:80` site with host matchers (`@www`, `@portfolio`) and roots `/opt/static-web/sites/www` and `/opt/static-web/sites/portfolio`. The site files are owned by uid 1001.
- Enter the host from `srv-saraswati` with `pct enter 105`. You are root there, so no `sudo` is needed in the steps below.

## The complete Caddyfile

The `portfolio` block is included so the file is complete and drop-in. Its policy is maintained in the fa-portfolio repo; if its hashes change there, update this copy to match. Tabs are used for indentation.

```caddyfile
# /etc/caddy/Caddyfile on lxc-staticweb (192.168.2.120). Both sites share one listener.
# Cloudflare Tunnel terminates TLS and forwards plain HTTP to :80, so there is no TLS config here.
:80 {
	@www host www.faysalahmed.ca
	handle @www {
		root * /opt/static-web/sites/www/current
		encode zstd gzip

		header {
			-Server
			X-Content-Type-Options "nosniff"
			Referrer-Policy "strict-origin-when-cross-origin"
			X-Robots-Tag "noindex, nofollow"
			X-Frame-Options "DENY"
			Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()"

			# Report-only first: violations show in the browser console as "[Report Only]" and nothing is blocked.
			# After a clean week, comment this line out and uncomment the enforcing line below it.
			Content-Security-Policy-Report-Only "default-src 'none'; script-src 'self' 'sha256-Ya0pUYrC7nM5Cn/056TyVuEiz6dFGrzmkWzgON0pF0U=' 'sha256-eIXWvAmxkr251LJZkjniEK5LcPF3NkapbJepohwYRIc='; style-src 'self' 'sha256-vv9IoKo7BSLbWcUHr3tNmfNVmm5L/9Cfn2H6LMk7/ow='; img-src 'self' data:; font-src 'self' data:; connect-src https://contact-api.jrflab.dev https://api.open-meteo.com https://geocoding-api.open-meteo.com; frame-src https://portfolio.faysalahmed.ca; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'"
			# Content-Security-Policy "default-src 'none'; script-src 'self' 'sha256-Ya0pUYrC7nM5Cn/056TyVuEiz6dFGrzmkWzgON0pF0U=' 'sha256-eIXWvAmxkr251LJZkjniEK5LcPF3NkapbJepohwYRIc='; style-src 'self' 'sha256-vv9IoKo7BSLbWcUHr3tNmfNVmm5L/9Cfn2H6LMk7/ow='; img-src 'self' data:; font-src 'self' data:; connect-src https://contact-api.jrflab.dev https://api.open-meteo.com https://geocoding-api.open-meteo.com; frame-src https://portfolio.faysalahmed.ca; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'"
		}

		# Hashed build output never changes under the same name.
		@www_assets path /_astro/*
		header @www_assets Cache-Control "public, max-age=31536000, immutable"
		# Everything else must revalidate, so switching `current` is visible on the next request.
		@www_pages not path /_astro/*
		header @www_pages Cache-Control "no-cache"

		file_server
	}

	@portfolio host portfolio.faysalahmed.ca
	handle @portfolio {
		root * /opt/static-web/sites/portfolio/current
		encode zstd gzip

		header {
			-Server
			X-Content-Type-Options "nosniff"
			Referrer-Policy "strict-origin-when-cross-origin"
			X-Robots-Tag "noindex, nofollow"

			# Enforced now. Limits who may embed the page; www.faysalahmed.ca embeds the tools, so it stays allowed.
			Content-Security-Policy "frame-ancestors https://www.faysalahmed.ca"

			# Report-only first: the full policy with hashes for Astro's inline island code. Promote it (rename the
			# header and drop the frame-ancestors-only line above) after a clean review.
			Content-Security-Policy-Report-Only "default-src 'none'; script-src 'self' 'sha256-Q2BPg90ZMplYY+FSdApNErhpWafg2hcRRbndmvxuL/Q=' 'sha256-Ya0pUYrC7nM5Cn/056TyVuEiz6dFGrzmkWzgON0pF0U='; style-src 'self' 'sha256-vv9IoKo7BSLbWcUHr3tNmfNVmm5L/9Cfn2H6LMk7/ow='; img-src 'self'; font-src 'self'; connect-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'; frame-ancestors https://www.faysalahmed.ca"
		}

		# Fingerprinted build output never changes, so it can be cached for a year. HTML must revalidate.
		@portfolio_assets path /_astro/*
		header @portfolio_assets Cache-Control "public, max-age=31536000, immutable"
		@portfolio_pages not path /_astro/*
		header @portfolio_pages Cache-Control "no-cache"

		file_server
	}
}
```

## How the CSP handles Astro's inline scripts

The page has two inline `<script>` blocks (the island bootstrap) and one inline `<style>` (`astro-island{display:contents}`). They are identical between builds of the same Astro version, so the policy allows them by SHA-256 hash instead of `'unsafe-inline'`. Everything else loads from `'self'`.

- Check the hashes after any Astro upgrade: `npm run build && npm run csp:hashes`. If they differ from the block above, update both CSP lines here.
- `tests/e2e/csp.spec.js` extracts the policy from this file, serves the built `dist/` with it as an _enforcing_ header, and exercises the shell, the terminal, a tool window and the contact form. It fails on any CSP violation and when the hashes here no longer match the build. CI therefore catches a stale hash before it reaches the host.
- React sets window geometry through the CSSOM (`style.setProperty`), which a CSP does not block, so no `style-src-attr` allowance is needed.
- `frame-src` must name the origin that `PUBLIC_TOOLS_ORIGIN` points at (default `https://portfolio.faysalahmed.ca`). `connect-src` must name the contact API (`PUBLIC_CONTACT_ENDPOINT`, default `contact-api.jrflab.dev`) and the two weather origins (`PUBLIC_WEATHER_ORIGIN`, default `api.open-meteo.com`; `PUBLIC_GEOCODING_ORIGIN`, default `geocoding-api.open-meteo.com`). Change any of these variables, change the matching source here. `Permissions-Policy` keeps `geolocation=()`: the Weather app searches by city name and never asks for the visitor's location.
- `X-Frame-Options: DENY` and `frame-ancestors 'none'` say nobody may embed www. The reverse direction is the portfolio's job: its site block needs `frame-ancestors https://www.faysalahmed.ca` (and nothing broader) so the Tools window can frame it. That header belongs in the fa-portfolio proposal, not here.

RISK: a wrong CSP blanks the shell, and a wrong `root` serves 404 until you revert the line. Both roll back the same way: restore the previous Caddyfile and restart (or reload) Caddy. The CSP starts as Report-Only so the first mistake cannot blank anything.

## Host migration (do these in order, before merging the PR)

Run everything **on `lxc-staticweb`** as root (`pct enter 105` from `srv-saraswati`). Steps 0 to 4 are designed so the live sites never change while you work, because `current` starts out pointing at an exact copy of the live files.

**Important: the Caddyfile covers both sites, so applying it switches both roots to `current` at once. Do steps 0 and 1 for BOTH sites (`www` and `portfolio`) before step 3.** Otherwise the site whose `current` is missing returns 404.

**0. Find the deploy owner and back up the Caddyfile.**

```bash
cd /opt/static-web/sites/www
stat -c 'owner uid:gid %u:%g' index.html          # the owner CI writes as (expect 1001:1001)
awk -F: '$3==1001 {print $1}' /etc/passwd        # its user name, if it has one
cp /etc/caddy/Caddyfile "/etc/caddy/Caddyfile.bak-$(date +%F)"
```

**1. Create the release layout, keeping the live files serving. Repeat for the other site (replace `www` with `portfolio` in every path).**

```bash
cd /opt/static-web/sites/www
test -s index.html && test ! -e current && echo "flat layout, ready"
mkdir -p releases/legacy
rsync -a --exclude='/releases/' --exclude='/current' ./ releases/legacy/
test -s releases/legacy/index.html && echo "legacy copy ok"
ln -s releases/legacy current
readlink current                                    # expect: releases/legacy
chown -R 1001:1001 releases                          # use the uid:gid printed in step 0
chown -h 1001:1001 current
```

The deploy user must also be able to create and rename entries directly inside `/opt/static-web/sites/www` (the deploy switches `current` there). It already owns the files, so check that the directory itself is owned by it: `ls -ld /opt/static-web/sites/www`. If it is root-owned, run `chown 1001:1001 /opt/static-web/sites/www`.

**2. Create the `SSH_KNOWN_HOSTS` repository secret.** Build the line from the host's own key, so nothing depends on trusting the network. It lists the host name, the Tailscale IP, and the MagicDNS name, so it matches whichever form your `SSH_HOST` secret uses:

```bash
FQDN="$(tailscale status --json 2>/dev/null | sed -n 's/.*"DNSName": *"\([^"]*\)\.".*/\1/p' | head -n 1)"
printf '%s %s\n' "lxc-staticweb,100.66.244.127${FQDN:+,$FQDN}" "$(cut -d' ' -f1,2 /etc/ssh/ssh_host_ed25519_key.pub)"
```

Copy the single line it prints. In GitHub open `fa-www`, Settings, Secrets and variables, Actions, New repository secret, name `SSH_KNOWN_HOSTS`, and paste the line. Also create the `production` environment (Settings, Environments) if it does not exist. The secret must exist before the first deploy; without it the deploy job stops with "SSH_KNOWN_HOSTS is empty" and never connects.

If `/etc/ssh/ssh_host_ed25519_key.pub` does not exist, the host key type differs: run `ls /etc/ssh/ssh_host_*_key.pub` and use that file and its key type instead.

**3. Apply the new Caddyfile.** Replace the whole file with the block above (keep the backup from step 0), validate, then reload:

```bash
nano /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
systemctl reload caddy
systemctl is-active caddy                           # expect: active
```

I could not run `caddy validate` where this file was written. Treat that command as required: if it prints an error, do not reload, and restore the backup (`cp /etc/caddy/Caddyfile.bak-<date> /etc/caddy/Caddyfile`).

RISK: a wrong `root` serves 404 for that site until you restore the backup and reload, and a bad CSP could blank the page. The CSP is report-only (plus the `frame-ancestors` rule on the portfolio), so the realistic failure is the `root` path or a Caddyfile syntax error, which `caddy validate` catches before the reload.

**4. Verify the host serves the symlinked copy with the new headers.** On the host:

```bash
readlink /opt/static-web/sites/www/current /opt/static-web/sites/portfolio/current
curl -sI -H 'Host: www.faysalahmed.ca' http://127.0.0.1/ | grep -iE '^(HTTP|content-security|x-content-type|referrer-policy|x-robots|cache-control)'
```

From any machine on the internet:

```bash
curl -sI https://www.faysalahmed.ca/ | grep -iE '^(HTTP|content-security|x-content-type|referrer-policy|x-robots|cache-control)'
```

Open the site in a browser with DevTools and confirm the console shows no `[Report Only]` violations. Open `https://www.faysalahmed.ca` and confirm the Tools window still loads the tools in their iframes (the portfolio's `frame-ancestors` rule must allow it). Add the Uptime Kuma keyword check from `docs/rollback.md` now.

**5. Create the other site's `SSH_KNOWN_HOSTS` secret** in its repo, with the same line from step 2 (the `production` environment too). The Caddyfile is already applied for both sites; each site's deploys start working once its own PR is merged. Do not merge either Phase 5 PR until that site has `releases/legacy`, `current`, and its secret.

**6. Merge the Phase 5 PR.** The deploy job writes `releases/<id>/`, switches `current`, and keeps the last five. Skip the local dry run: it needs a bash checkout, and a failed first deploy is harmless because it stops before switching `current`. Watch the Deploy job, then:

```bash
ls -la /opt/static-web/sites/www/releases
readlink /opt/static-web/sites/www/current
curl -sI https://www.faysalahmed.ca/ | head -n 1
```

**7. After the first real deploy.**

```bash
ls -la /opt/static-web/sites/www/releases && readlink /opt/static-web/sites/www/current
curl -sI https://www.faysalahmed.ca/ | head -n 1
```

When you are satisfied, remove the pre-migration files that still sit directly in `/opt/static-web/sites/www/` (everything except `releases` and `current`). They are no longer served; `releases/legacy` holds the copy and ages out after five newer releases.

**8. Enforce the CSP (a week later).** In the Caddyfile, comment out the `Content-Security-Policy-Report-Only` line and uncomment the enforcing one, then validate and reload as in step 4. Verify with `curl -sI https://www.faysalahmed.ca/ | grep -i content-security` and load the site once in a browser. To undo, swap the two lines back.

## Rollback of this config

Restore the backup and apply it:

```bash
cp /etc/caddy/Caddyfile.bak-<date> /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile && systemctl reload caddy
```
