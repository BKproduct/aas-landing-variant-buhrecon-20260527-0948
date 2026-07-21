#!/usr/bin/env bash
# Deploy swiss-pulse-lab copy to Cloudflare Pages preview branch.
# This does not deploy to the production branch/domain.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
LEG="${AAS_LEGACY_STATIC:-/tmp/aas-landing-preview}"
DEPLOY="${TMPDIR:-/tmp}/cf-aas-dev-deploy-$$"
BRANCH="${AAS_DEV_BRANCH:-dev}"

if [[ ! -d "$LEG/landing-brief" ]]; then
  echo "Clone legacy static extras first:"
  echo "  git clone --depth 1 https://github.com/BKproduct/aas-landing-preview.git $LEG"
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "${HOME}/.env"
set +a

rm -rf "$DEPLOY"
mkdir -p "$DEPLOY"
cp "$ROOT/index.html" "$DEPLOY/"
cp "$ROOT/Landing-Modernise.mp4" "$DEPLOY/"
cp -R "$ROOT/assets" "$DEPLOY/"
cp -R "$ROOT/insights" "$DEPLOY/"
cp -R "$ROOT/call" "$DEPLOY/"
cp "$ROOT/robots.txt" "$ROOT/sitemap.xml" "$DEPLOY/"
cp "$ROOT/llms.txt" "$DEPLOY/"
cp -R "$ROOT/llm-info" "$DEPLOY/"
cp "$ROOT/google6eebbda1a6a1d7c3.html" "$DEPLOY/"
cp "$LEG/privacy.html" "$LEG/404.html" "$DEPLOY/"
cp "$ROOT/favicon.svg" "$DEPLOY/"
cp "$ROOT/favicon.ico" "$DEPLOY/"
cp -R "$LEG/landing-brief" "$DEPLOY/"
{
  printf '/ru\t/ru/\t301\n'
  printf '/de\t/de/\t301\n'
  printf '/call\t/call/\t301\n'
  printf '/cases/\t/#case-studies\t301\n'
  printf '/ru/cases/\t/ru/#case-studies\t301\n'
  printf '/de/cases/\t/de/#case-studies\t301\n'
} > "$DEPLOY/_redirects"

node "$ROOT/scripts/dev-overlay.mjs" "$DEPLOY"

SHA="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo manual)"
npx wrangler pages deploy "$DEPLOY" \
  --project-name=ai-automation-studio \
  --branch="$BRANCH" \
  --commit-message="deploy: swiss-pulse-lab dev ${SHA}"

rm -rf "$DEPLOY"
echo "Dev preview branch: ${BRANCH}"
