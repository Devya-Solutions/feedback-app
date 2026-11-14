#!/usr/bin/env bash
# Production deploy to the Devya VPS. The site left Vercel after the
# 2026-11-13 account pause and runs there behind nginx.
#
#   bash scripts/deploy.sh
#
# Nothing is built on the VPS. This script:
#   1. exports origin/main (never the working tree) to a temp dir on this Mac,
#   2. builds the Next standalone server there (NEXT_PUBLIC_* come from the env
#      file on the VPS, copied into the temp dir for the build and deleted after),
#   3. swaps the macOS native addons (sharp) for their Linux x86-64 musl builds,
#   4. ships the tree to $DIR/releases/<sha> and points $DIR/current at it,
#   5. recreates the container: stock node image, ./current mounted read-only,
#      `node server.js` (docker-compose.prod.yml has no build step),
#   6. waits for it, checks the page title and reports the public hosts.
# Rollback: point current at an older release and rerun
#   docker compose -f docker-compose.prod.yml up -d --force-recreate
set -euo pipefail
cd "$(dirname "$0")/.."

VPS="${VPS:-root@72.61.81.59}"
APP="feedback-app"
CONTAINER="devya-feedback-app"
DIR="/home/devya/projects/$APP"
ENV_FILE=""   # no secrets; API_PROXY_TARGET is set below and in the compose file
PORT=3153
HOSTS=(feedback.devya-solutions.com)
TITLE_PATH="/"
EXPECT_TITLE="Devya Feedback"
KEEP_RELEASES=3

git fetch -q origin main
SHA="$(git rev-parse origin/main)"
echo "deploy: $APP @ ${SHA:0:7} -> $VPS:$DIR (127.0.0.1:$PORT)"

WORK="$(mktemp -d "${TMPDIR:-/tmp}/deploy-$APP.XXXXXX")"
trap 'rm -rf "${WORK:?}"' EXIT
SRC="$WORK/src"
mkdir -p "$SRC"
git archive --format=tar origin/main | tar -x -C "$SRC"

if [ -n "$ENV_FILE" ]; then
  (umask 077; ssh -n "$VPS" "cat '$ENV_FILE'" > "$SRC/.env.production.local") \
    || { echo "deploy: $ENV_FILE is missing on the VPS" >&2; exit 1; }
  [ -s "$SRC/.env.production.local" ] || { echo "deploy: $ENV_FILE is empty" >&2; exit 1; }
fi

# --- build on this Mac: one heavy job at a time across agents, load < 15 first -
LOCK=/tmp/vx-mac-build.lock
while [ "$(sysctl -n vm.loadavg | awk '{print int($2)}')" -ge 15 ]; do sleep 20; done
until mkdir "$LOCK" 2>/dev/null; do sleep 20; done
trap 'rmdir "$LOCK" 2>/dev/null; rm -rf "${WORK:?}"' EXIT
(
  cd "$SRC"
  export NEXT_TELEMETRY_DISABLED=1
  # The /api rewrite in next.config.mjs is resolved at build time.
  export API_PROXY_TARGET="https://api.devya-solutions.com"
  npm ci --no-audit --no-fund
  npm run build
)
rmdir "$LOCK"
trap 'rm -rf "${WORK:?}"' EXIT
rm -f "$SRC/.env.production.local"

# --- assemble the release tree ------------------------------------------------
REL="$SRC/.next/standalone"
[ -f "$REL/server.js" ] || { echo "deploy: $REL/server.js missing (is output: 'standalone' set?)" >&2; exit 1; }
rm -f "$REL"/.env*
cp -R "$SRC/.next/static" "$REL/.next/static"
[ -d "$SRC/public" ] && cp -R "$SRC/public" "$REL/public"
mkdir -p "$REL/.next/cache"   # mount point for the writable tmpfs
echo "$SHA" > "$REL/REVISION"

# sharp ships per-platform binaries; replace the macOS ones with linux-x64 musl.
while IFS= read -r pj; do
  sharp_dir="$(dirname "$pj")"
  img_dir="$(dirname "$sharp_dir")/@img"
  mkdir -p "$img_dir"
  for pkg in @img/sharp-linuxmusl-x64 @img/sharp-libvips-linuxmusl-x64; do
    ver="$(node -p "(require('$pj').optionalDependencies || {})['$pkg'] || ''")"
    [ -n "$ver" ] || continue
    tgz="$(cd "$WORK" && npm pack --silent "$pkg@$ver" | tail -1)"
    rm -rf "${img_dir:?}/${pkg#@img/}"
    mkdir -p "$img_dir/${pkg#@img/}"
    tar -xzf "$WORK/$tgz" -C "$img_dir/${pkg#@img/}" --strip-components=1
  done
done < <(find "$REL" -path '*/node_modules/sharp/package.json')
find "$REL" \( -type d -o -type l \) \( -name 'sharp-darwin-*' -o -name 'sharp-libvips-darwin-*' \) -prune -exec rm -rf {} +
bad="$(find "$REL" -name '*.node' -exec file {} + | grep -v 'ELF 64-bit LSB.*x86-64' || true)"
[ -z "$bad" ] || { printf 'deploy: native addons not built for Linux x86-64:\n%s\n' "$bad" >&2; exit 1; }
find "$REL" -name '*.node' -exec file {} + | sed "s|$REL/||;s/^/deploy: native /"

# --- ship and switch ----------------------------------------------------------
ssh -n "$VPS" "mkdir -p '$DIR/releases' && rm -rf '${DIR:?}/releases/$SHA.tmp' && mkdir '$DIR/releases/$SHA.tmp'"
COPYFILE_DISABLE=1 tar -C "$REL" -czf - . \
  | ssh "$VPS" "tar -xzf - --no-same-owner --warning=no-unknown-keyword -C '$DIR/releases/$SHA.tmp'"
scp -q "$SRC/docker-compose.prod.yml" "$VPS:$DIR/docker-compose.prod.yml"
ssh -n "$VPS" "set -e; cd '$DIR';
  rm -rf 'releases/$SHA'; mv 'releases/$SHA.tmp' 'releases/$SHA';
  ln -sfn 'releases/$SHA' current.tmp && mv -T current.tmp current;
  docker compose -f docker-compose.prod.yml up -d --force-recreate;
  ls -1t releases | grep -v -x '$SHA' | tail -n +$KEEP_RELEASES | sed 's|^|releases/|' | xargs -r rm -rf"

ssh -n "$VPS" "for i in \$(seq 1 40); do
    c=\$(curl -s -o /dev/null -m 5 -w '%{http_code}' http://127.0.0.1:$PORT/);
    case \$c in 2*|3*) echo \"deploy: container answers \$c\"; exit 0;; esac; sleep 3;
  done; echo 'deploy: container did not answer in 120s' >&2; docker logs --tail 50 $CONTAINER; exit 1"

title="$(ssh -n "$VPS" "curl -s -m 15 -H 'Host: ${HOSTS[0]}' http://127.0.0.1:$PORT$TITLE_PATH" \
  | grep -o '<title>[^<]*' | head -1 | sed 's/<title>//' || true)"
echo "deploy: title on 127.0.0.1:$PORT$TITLE_PATH = \"$title\""
case "$title" in *"$EXPECT_TITLE"*) ;; *) echo "deploy: expected a title containing \"$EXPECT_TITLE\"" >&2; exit 1 ;; esac

# Informational: hosts still on Vercel DNS answer 402 until their records move.
for host in "${HOSTS[@]}"; do
  code="$(curl -s -o /dev/null -m 15 -w '%{http_code}' "https://$host/" || true)"
  echo "deploy: https://$host/ -> $code"
done
echo "deploy: done (${SHA:0:7})"
