#!/usr/bin/env bash
# Runs ON THE HOST (the deploy job pipes it over ssh; you can also run it by hand for a rollback).
#
#   activate-release.sh check    BASE            layout is ready for atomic releases
#   activate-release.sh activate BASE ID [KEEP]  point BASE/current at releases/ID, then prune to KEEP releases
#   activate-release.sh list     BASE            show releases, newest first, marking the live one
#
# Layout: BASE/releases/<id>/ holds one full copy of the site, BASE/current is a symlink to one of
# them, and the web server's root is BASE/current. The switch is a rename, so a request never sees a
# half-written site. Pruning keeps the newest KEEP releases and never removes the live one.
set -euo pipefail

die() {
  printf 'activate-release: %s\n' "$*" >&2
  exit 1
}

mode="${1:-}"
base="${2:-}"
[[ -n "$mode" && -n "$base" ]] || die "usage: activate-release.sh check|activate|list BASE [ID] [KEEP]"
[[ "$base" == /* ]] || die "BASE must be an absolute path (got '$base')"
releases="$base/releases"
current="$base/current"

check_layout() {
  [[ -d "$releases" ]] || die "$releases does not exist. Complete the host migration in docs/caddy/Caddyfile.proposed.md first."
  if [[ -e "$current" && ! -L "$current" ]]; then
    die "$current exists and is not a symlink. Complete the host migration first; refusing to replace a real directory."
  fi
}

live_release() {
  if [[ -L "$current" ]]; then basename "$(readlink "$current")"; fi
}

case "$mode" in
  check)
    check_layout
    echo "layout ok"
    ;;

  list)
    check_layout
    live="$(live_release)"
    # shellcheck disable=SC2012  # directory names are hex ids or 'legacy', so ls is safe here
    for dir in $(ls -1dt "$releases"/*/ 2>/dev/null); do
      name="$(basename "$dir")"
      if [[ "$name" == "$live" ]]; then echo "* $name (live)"; else echo "  $name"; fi
    done
    ;;

  activate)
    id="${3:-}"
    keep="${4:-5}"
    [[ "$id" =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$ ]] || die "invalid release id '$id'"
    [[ "$keep" =~ ^[1-9][0-9]*$ ]] || die "KEEP must be a positive integer (got '$keep')"
    check_layout
    [[ -d "$releases/$id" ]] || die "release $releases/$id does not exist"
    [[ -s "$releases/$id/index.html" ]] || die "release $id has no index.html; refusing to activate it"

    touch "$releases/$id" # recency marker: pruning keeps the most recently activated releases
    tmp="$base/.current.$$"
    ln -s "releases/$id" "$tmp"
    mv -T -f "$tmp" "$current" # rename(2): atomic, unlike ln -sfn over an existing symlink
    echo "activated $id"

    live="$(live_release)"
    kept=0
    # shellcheck disable=SC2012
    for dir in $(ls -1dt "$releases"/*/ 2>/dev/null); do
      name="$(basename "$dir")"
      kept=$((kept + 1))
      if [[ "$name" == "$live" || "$kept" -le "$keep" ]]; then continue; fi
      rm -rf -- "${releases:?}/${name:?}"
      echo "pruned $name"
    done
    ;;

  *)
    die "unknown mode '$mode'"
    ;;
esac
