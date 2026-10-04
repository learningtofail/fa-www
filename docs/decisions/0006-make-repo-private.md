# 0006: Runbook, making the repo private

Status: **not done.** This is the last step of the refactor plan and it is yours to take, after every other PR has merged and the host migration is finished.

RISK: private repos stop anonymous reads. Any clone, link or CI job that relied on public access fails. Private repos also draw on your plan's Actions minutes. Revert in repository settings (Settings, General, Danger Zone, Change visibility) if anything breaks; nothing is deleted.

## Before

1. All phase PRs merged; `main` deployed through `releases/`; Uptime Kuma checks green (`docs/monitoring.md`).
2. Keep the Orchis design-system repo **public**. `npm run tokens:check --require-network` in CI fetches it without a credential. If it must go private, give CI a token first.
3. Check that nothing else reads this repo anonymously: README links from other sites, `git clone` over https in scripts on the host, any package that depends on it. The deploy does not clone on the host (CI rsyncs the artifact), so it is unaffected.
4. Confirm your plan's Actions minutes cover the CI load (about five jobs per push, one e2e).

## Do

```bash
gh repo edit learningtofail/fa-www --visibility private --accept-visibility-change-consequences
```

## Verify (from a machine with no GitHub credentials)

```bash
git ls-remote https://github.com/learningtofail/fa-www     # must prompt for a password or fail
curl -sI https://github.com/learningtofail/fa-www | head -n 1   # expect 404
```

Then push a trivial docs change on a branch, open a PR, and confirm CI still runs and passes. After the next merge to `main`, confirm the deploy job still runs.

## Roll back

Run `gh repo edit learningtofail/fa-www --visibility public --accept-visibility-change-consequences`, or use the Danger Zone setting.
