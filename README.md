# Devya Feedback

Client review flow for Devya Solutions at `feedback.devya-solutions.com`: public
review pages (`/`, `/r/*`) and an `/admin` area gated by the shared
`devya_session` cookie (unauthenticated admins go to the admin app's login).
The browser calls `/api/*`, which Next rewrites to the Devya backend
(`API_PROXY_TARGET`, default `https://api.devya-solutions.com`).

## Development

```bash
npm install
npm run dev        # portless: https://feedback.localhost:1355
```

Env vars: see `.env.example`.

## Hosting

The app left Vercel after the 2026-11-13 account pause. It now runs on the
Devya VPS (`72.61.81.59`) behind nginx. Nothing is built on the VPS:

- `bash scripts/deploy.sh` (from the Mac) exports `origin/main`, builds the Next
  standalone server locally (`output: 'standalone'`), swaps the macOS native
  addons (sharp) for their Linux x86-64 builds, ships the tree to
  `/home/devya/projects/feedback-app/releases/<sha>` and points `current` at it.
- `docker-compose.prod.yml` runs that tree read-only on a stock
  `node:24.22.1-alpine` image (no build step): container `devya-feedback-app`
  on `127.0.0.1:3153`.
- Host: `feedback.devya-solutions.com` (nginx file
  `/etc/nginx/sites-available/devya-feedback-app`, TLS by certbot).
- Env vars: only `API_PROXY_TARGET=https://api.devya-solutions.com`, set at
  build time by `scripts/deploy.sh` (the rewrite is resolved then) and at
  runtime by the compose file. No secrets.
- Rollback: point `current` at an older release, then
  `docker compose -f docker-compose.prod.yml up -d --force-recreate`.
- Merge gate: `scripts/ci-local.sh` (install, lint, typecheck, build). The repo
  is not on the Tabib CI Jenkins job list yet, so run it locally and post its
  tail on the PR; `Jenkinsfile` runs the same script once it is added. The
  GitHub Actions workflows no longer gate merges.
