# Rollback runbook

www is static and stateless. Every deploy writes a full copy of the site to `releases/<git sha>/` on the static host and then switches the `current` symlink to it with a single rename. Caddy's `root` is `current`. The last five releases are kept, so a rollback is one command and takes effect on the next request.

```
/opt/static-web/sites/www/            DEPLOY_BASE (verify the path on the host)
  releases/
    <sha-newest>/                     full site, index.html at the top
    <sha-previous>/
    ...                               five kept
  current -> releases/<sha-newest>    what Caddy serves
```

## Roll back

1. List releases from your checkout (the live one is marked). `activate-release.sh` runs on the host through ssh, so nothing needs installing there:

   ```bash
   ssh deployer@HOST 'bash -s -- list /opt/static-web/sites/www' < scripts/activate-release.sh
   ```

2. Switch to the previous release (one command):

   ```bash
   ssh deployer@HOST 'bash -s -- activate /opt/static-web/sites/www <previous-sha> 5' < scripts/activate-release.sh
   ```

   Without the script, the same switch by hand is atomic as long as you use `mv -T`:

   ```bash
   cd /opt/static-web/sites/www
   ln -s releases/<previous-sha> .current.tmp && mv -T -f .current.tmp current
   ```

3. Verify at the layer that matters, from any machine:

   ```bash
   curl -sI https://www.faysalahmed.ca/ | head -n 1
   curl -s https://www.faysalahmed.ca/ | grep -o 'making Google behave' | head -n 1
   ssh deployer@HOST 'readlink /opt/static-web/sites/www/current'
   ```

4. Stop the bad commit from redeploying: revert it on `main` (a normal PR). The next deploy then ships the fix as a new release. Do not re-run an old workflow to "roll back"; that would deploy the old commit and prune a newer release.

Re-activating an old release marks it as the most recently used, so it survives pruning. The live release is never pruned.

## Failure cases

| Symptom                                                            | Cause                                                                 | Fix                                                                                                                  |
| ------------------------------------------------------------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Deploy job fails at "Require the pinned SSH host key"              | `SSH_KNOWN_HOSTS` secret is empty                                     | Create the secret (see `docs/caddy/Caddyfile.proposed.md`, step 3)                                                   |
| Deploy job fails with "releases does not exist" or "not a symlink" | Host migration not done                                               | Do steps 1 and 2 of the host migration, then re-run the job                                                          |
| Deploy job fails with `Host key verification failed`               | Host key changed, or the secret holds a key for a different host name | Compare fingerprints, then update the secret                                                                         |
| Site returns 404 after a Caddy change                              | `root` points at a path without `current`                             | Restore the previous Caddyfile and restart Caddy                                                                     |
| Page is blank after enabling the CSP                               | A script or style hash no longer matches (Astro upgraded)             | Remove the `Content-Security-Policy` header line, restart Caddy, then run `npm run csp:hashes` and update the hashes |

Restoring the Caddyfile: `admin off` on some hosts means a reload is not available. If the same pattern applies here (unverified), use `systemctl restart caddy` instead of `caddy reload`.

## Health check

Add an Uptime Kuma monitor of type HTTP(s) - Keyword:

| Field              | Value                          |
| ------------------ | ------------------------------ |
| Name               | `www.faysalahmed.ca (keyword)` |
| URL                | `https://www.faysalahmed.ca/`  |
| Keyword            | `making Google behave`         |
| Interval / retries | 60 s / 2                       |

The keyword lives in the static HTML (the `<noscript>` block), so it proves the right site is served without running JavaScript. A 404, an empty directory or a stale site with different copy all fail it. This is the monitor to watch after a deploy, a rollback or a Caddy change.

## Backup

The site is stateless and rebuilds from git. Nothing here needs backing up. The restore check is the rollback above: re-point `current` at the previous release and run the `curl` checks.
