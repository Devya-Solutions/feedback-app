#!/usr/bin/env bash
# The merge gate. This repo is not on the Tabib CI Jenkins job list yet, so run
# it locally and post the tail on the PR: bash scripts/ci-local.sh
# (Jenkinsfile runs the same script once the repo joins the job list.)
set -euo pipefail
cd "$(dirname "$0")/.."
# A hung registry connection must not hold the shared Mac build lock: installs time out.

timeout -k 30 600 npm ci --no-audit --no-fund
npm run lint
npx tsc --noEmit -p .
npm run build
echo "ci-local: all steps passed"
