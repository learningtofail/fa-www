#!/usr/bin/env bash
# Deploys a built dist/ as an atomic release over SSH. Called by the deploy job in ci.yml; see
# docs/rollback.md. Everything arrives through environment variables, nothing is hardcoded.
#
# Required: DEPLOY_HOST DEPLOY_USER RELEASE_ID SSH_KEY_FILE SSH_KNOWN_HOSTS_FILE
# Optional: DIST_DIR (dist)  DEPLOY_BASE (/opt/static-web/sites/www)  KEEP_RELEASES (5)  DRY_RUN (0)
#
# DRY_RUN=1 runs the host layout check and an rsync --dry-run, then stops before anything is
# written or switched.
set -euo pipefail

die() {
  printf 'deploy: %s\n' "$*" >&2
  exit 1
}

: "${DEPLOY_HOST:?DEPLOY_HOST is required}"
: "${DEPLOY_USER:?DEPLOY_USER is required}"
: "${RELEASE_ID:?RELEASE_ID is required (the git commit SHA)}"
: "${SSH_KEY_FILE:?SSH_KEY_FILE is required}"
: "${SSH_KNOWN_HOSTS_FILE:?SSH_KNOWN_HOSTS_FILE is required}"
dist_dir="${DIST_DIR:-dist}"
base="${DEPLOY_BASE:-/opt/static-web/sites/www}"
keep="${KEEP_RELEASES:-5}"
dry_run="${DRY_RUN:-0}"
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[[ "$RELEASE_ID" =~ ^[0-9a-f]{7,40}$ ]] || die "RELEASE_ID must be a git SHA (got '$RELEASE_ID')"
[[ -s "$dist_dir/index.html" ]] || die "refusing to deploy: $dist_dir/index.html is missing or empty"
[[ -s "$SSH_KNOWN_HOSTS_FILE" ]] || die "the SSH_KNOWN_HOSTS secret is empty. Create it first (docs/caddy/Caddyfile.proposed.md, step 3). Not connecting without a pinned host key."

ssh_opts=(-i "$SSH_KEY_FILE" -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$SSH_KNOWN_HOSTS_FILE")
target="$DEPLOY_USER@$DEPLOY_HOST"
release_dir="$base/releases/$RELEASE_ID"

remote() {
  ssh "${ssh_opts[@]}" "$target" bash -s -- "$@" <"$here/activate-release.sh"
}

echo "deploy: checking host layout"
remote check "$base"

# --delete only ever touches the new release directory, never the live site.
rsync_args=(-az --delete -e "ssh ${ssh_opts[*]}")
if [[ "$dry_run" == "1" ]]; then
  rsync_args+=(--dry-run --itemize-changes)
fi
echo "deploy: syncing $dist_dir/ to $release_dir/"
rsync "${rsync_args[@]}" "$dist_dir"/ "$target:$release_dir/"

if [[ "$dry_run" == "1" ]]; then
  echo "deploy: dry run, stopping before activation"
  exit 0
fi

remote activate "$base" "$RELEASE_ID" "$keep"
echo "deploy: $RELEASE_ID is live"
