---
name: convert-to-cloudflare-internal-app
description: Convert an existing local WorkOS internal app into a Cloudflare-hosted internal app using Wrangler, Doppler, Cloudflare Access, and the internal-app-example deployment patterns. Use when asked to deploy a local app to Cloudflare, migrate an internal tool to workos.tools, add Wrangler/Doppler config, or turn a prototype into a production internal app.
---

# Convert to a Cloudflare Internal App

Use this skill to convert an existing local application into a WorkOS internal app deployed to the Internal Apps Cloudflare account. This repository is the reference implementation; copy only the pieces the target app needs.

## Default Operating Mode

This skill is intended to work for non-technical users. If the user says "convert this app", "deploy this as an internal app", or similar, proceed in implementation mode by default:

1. Inspect the app and choose the safest reasonable conversion path.
2. Make minimal local repository changes.
3. Run the validation commands you can infer from the repo.
4. Summarize what changed, what passed, and what the user still needs to do.

Do not ask the user to review an architecture plan before editing unless they explicitly ask for a plan-only pass.

Only stop and ask a question when continuing would be unsafe or impossible to infer. Ask in plain language with concrete options. Good reasons to stop:

- Creating remote Cloudflare resources or changing production DNS/Access settings.
- Choosing a final production domain when it is not obvious.
- Provisioning Doppler projects, GitHub secrets, or other sensitive credentials.
- The app cannot run on Cloudflare Workers without a meaningful rewrite.
- Two viable conversion paths would produce materially different product behavior.

When a remote resource is required but not approved yet, add safe local placeholders where useful, document the exact command to run, and continue with local validation that does not need the remote resource.

Before adding CI, establish whether the existing app's checks already pass. Do not add a new deploy workflow step that is known to fail for unrelated pre-existing lint, typecheck, or test issues. If an existing issue is small, fix it. If it is unrelated or broad, keep the deploy workflow focused on the Cloudflare build/deploy path and document the existing issue as a follow-up.

## Principles

- Prefer adapting the existing app in place when it has meaningful code, history, or framework choices.
- Use this template as the starting point only for greenfield apps, tiny throwaway prototypes, or apps that are easier to rebuild than adapt.
- Add only the Cloudflare resources the app actually needs.
- Keep internal UI behind Cloudflare Access. Split public callback/webhook endpoints into a separate route or worker when needed.
- Use Cloudflare bindings and `Env` types inside Workers. Do not read secrets with `process.env` in Worker runtime code.
- Never commit `.dev.vars`, `.env`, API tokens, or Doppler secret values.

## Before Editing

Inventory the target app internally before changing files:

1. Package manager and scripts: npm, pnpm, yarn, bun; `dev`, `build`, `lint`, `typecheck`, `test`.
2. Framework and rendering model: static SPA, Vite SSR, React Router, Remix, TanStack, Next.js, Express, API-only, or other.
3. Runtime needs: Web APIs only, Node compatibility, long-running server, filesystem access, child processes, native modules.
4. Existing deployment config: `wrangler.toml`, `wrangler.jsonc`, Pages config, GitHub Actions, Dockerfile, Vercel, Fly, Render, Railway.
5. Environment variables and secrets: local `.env*`, documented config, CI secrets, callback URLs.
6. Cloudflare resources needed: D1, R2, KV, Queues, Workflows, AI Gateway, Vectorize, Durable Objects, Cron Triggers.
7. External exposure: internal-only UI, public webhooks/callbacks, OAuth redirects, Slack commands, scheduled jobs.
8. Auth/access: Cloudflare Access, WorkOS AuthKit, app-level authorization.

If the app depends on unsupported Worker runtime features, stop and explain the blocker in plain language before adding Wrangler.

## Choose the Deployment Shape

Use the least complex shape that supports the app:

- Static SPA/build output: deploy static assets with a Worker assets binding or Cloudflare Pages. Add a Worker only if the app needs server logic, bindings, or Access-aware behavior.
- React Router 7, Remix, TanStack Start, or Vite SSR: use Cloudflare Workers with the Cloudflare Vite plugin. Follow this repo's `workers/app.ts`, `vite.config.ts`, and `wrangler.toml` patterns.
- Next.js: first check if the app can run through `@opennextjs/cloudflare`. If it can, use the OpenNext Cloudflare setup and validate with `npx opennextjs-cloudflare build` plus `npx wrangler deploy --dry-run`. Use Node 22 or newer in CI because OpenNext Cloudflare packages require it.
- Existing Worker app: keep the current Worker and normalize it to WorkOS internal conventions: account, routes, observability, Doppler, CI, bindings, and generated types.
- Express or Node-server app: do not blindly wrap it. Check whether it can run on Workers. If not, recommend either a Worker-compatible adapter/rewrite or a different hosting path.
- Background jobs: use a separate Worker with Workflows, Queues, Cron Triggers, or a simple scheduled Worker. Follow this repo's `wrangler.worker.toml` pattern only when a separate worker is needed.

## WorkOS Internal Defaults

Use these defaults unless the app owner gives a different internal standard:

- Cloudflare account ID: `7e7fcec4d315661895440b439328033d`
- Domain: `<app-name>.workos.tools` by default. Also valid when appropriate: `*.workos.foo`, `*.workos.bot`.
- `workers_dev = false` for production internal apps.
- Enable `[observability]`.
- Use `compatibility_flags = ["nodejs_compat"]` only when the app needs Node compatibility.
- Prefer lowercase hyphenated names: app `<name>`, D1 `<name>-db`, R2 `<name>-images`, worker `<name>-workflow`.

## Wrangler Conversion Checklist

1. Add or update `wrangler.toml`.
2. Set `name`, `main`, `compatibility_date`, `account_id`, `workers_dev`, route, assets binding, and observability.
3. Add only required bindings:
   - D1: `[[d1_databases]]` with `binding = "DB"`, `database_name`, `database_id`, and `migrations_dir` if migrations exist.
   - R2: `[[r2_buckets]]` with a descriptive binding such as `IMAGE_BUCKET` or `DOCUMENT_BUCKET`.
   - Workflows: `[[workflows]]` only for workflow workers.
   - AI Gateway/Workers AI: add `[ai]` only when the app uses it.
   - KV/Queues/Durable Objects/Vectorize: add only when required.
4. Generate Worker types after config changes:
   ```bash
   npx wrangler types
   ```
5. Update runtime code to receive `env` and `ctx` from the Worker request handler. Pass them through framework context when applicable.

## Cloudflare Resources

Create resources explicitly and write returned IDs back into Wrangler config:

```bash
npx wrangler d1 create <app-name>-db
npx wrangler r2 bucket create <app-name>-images
npx wrangler kv namespace create <app-name>
```

Only run commands for resources the app uses. For D1 apps, add migrations under `migrations/` and verify both local and remote migration commands.

## Doppler

Use Doppler for secrets and mount local secrets into `.dev.vars` for Worker tooling.

Choose the Doppler project this way:

1. If the app already clearly uses a Doppler project in `doppler.yaml`, README docs, package scripts, CI, or existing deploy config, keep that project.
2. If there is no clear Doppler project yet, default to `claude-day` for now.
3. Use `dev` for local development and `prd` for production deploys unless the existing app already uses different config names such as `prod`.

Recommended local dev shape:

```bash
doppler setup --project <doppler-project> --config dev
doppler run --project <doppler-project> --config dev --mount .dev.vars --mount-format env -- <dev-command>
```

Recommended CI deploy shape:

```bash
doppler run --project <doppler-project> --config prd -- npx wrangler deploy
```

For standalone repos, populate required GitHub Actions secrets automatically when `gh` and Doppler are authenticated:

```bash
doppler configs tokens create --project <doppler-project> --config <prod-config> github-actions-deploy --plain | gh secret set DOPPLER_KEY
doppler secrets get CLOUDFLARE_API --project <doppler-project> --config <prod-config> --plain | gh secret set CLOUDFLARE_API
doppler secrets get CLOUDFLARE_ACCOUNT_ID --project <doppler-project> --config <prod-config> --plain | gh secret set CLOUDFLARE_ACCOUNT_ID
```

Map these GitHub secrets into the environment variables the deploy tooling expects in GitHub Actions:

```yaml
env:
  DOPPLER_TOKEN: ${{ secrets.DOPPLER_KEY }}
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API }}
  CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

Use the repository's established GitHub secret names if they already exist. For example, keep `DOPPLER_TOKEN` as the GitHub secret name if the workflow already uses `${{ secrets.DOPPLER_TOKEN }}`, write the Doppler `CLOUDFLARE_API` value to `CLOUDFLARE_API_TOKEN` if the workflow expects that name, and use `INTERNAL_APPS_CLOUDFLARE_API_TOKEN` / `INTERNAL_APPS_CLOUDFLARE_ACCOUNT_ID` instead of the generic Cloudflare names if the repo is already configured that way.

For the current default `claude-day` project, expect production Cloudflare values in Doppler under the production config as `CLOUDFLARE_API` and `CLOUDFLARE_ACCOUNT_ID`. If the Doppler project uses `CLOUDFLARE_API_KEY` or `CLOUDFLARE_API_TOKEN` instead, use that existing key and write it to the GitHub secret name the workflow expects.

Never print secret values. Pipe secrets directly into `gh secret set`. If a Doppler secret is missing, stop and explain which key needs to be added to the `prd` config.

If there is a separate worker config, make sure its deployment also runs under the same Doppler project/config. Do not create or seed sensitive Doppler values without explicit approval from the app owner.

## CI/CD

For a standalone internal app repo, use this repo's `.github/workflows/build-test-deploy.yml` as the starting pattern:

1. Install dependencies.
2. Use the Node version required by the target framework and deployment adapter. Use Node 22 or newer for `@opennextjs/cloudflare`.
3. Run only lint/typecheck/tests that pass or that you fix in the same change.
4. Do not add newly introduced CI gates for unrelated pre-existing app failures. Document those as follow-ups instead.
5. Run local D1 migrations if D1 is configured.
6. Build for the chosen Cloudflare target.
7. On `main`, install Doppler CLI, sync Doppler secrets to Cloudflare, run remote D1 migrations, and deploy.

For apps in the WorkOS monorepo, prefer the shared deploy action at `.github/actions/deployment/internal-cloudflare` and follow existing internal app workflows such as Horizon.

Required GitHub secrets for standalone repos:

- `DOPPLER_KEY` for the Doppler service token, mapped to `DOPPLER_TOKEN` in workflow `env`
- `CLOUDFLARE_API` from Doppler, mapped to `CLOUDFLARE_API_TOKEN` in workflow `env`
- `CLOUDFLARE_ACCOUNT_ID` or `INTERNAL_APPS_CLOUDFLARE_ACCOUNT_ID`

Create these with `gh secret set` from Doppler as described above instead of asking non-technical users to copy and paste values.

## Validation

Run the checks that exist in the target app before and after conversion when practical. At minimum, verify:

```bash
npx wrangler types
npm run lint
npm run build
npx wrangler deploy --dry-run
```

For OpenNext Cloudflare apps, verify:

```bash
npx opennextjs-cloudflare build
npx wrangler deploy --dry-run
```

If an existing check fails on unrelated app code, do not silently create a failing deploy workflow. Fix the issue if it is small and safe. Otherwise, keep the Cloudflare deploy workflow to checks that pass, and clearly list the existing failure in the final summary.

If the app has D1:

```bash
npm run db:migrate:local
```

If the app has a dev server:

```bash
npm run dev
```

After first deploy, verify Cloudflare Access:

```bash
cloudflared access login <app-name>.workos.tools
```

Then open the deployed app and confirm the protected internal route loads.

## Output Expected from the Agent

When finished, summarize:

- Deployment shape chosen and why.
- Files changed.
- Cloudflare resources added or intentionally skipped.
- Doppler project/config assumptions.
- Required GitHub secrets.
- Local validation commands and results.
- Any manual follow-up for Cloudflare Access, DNS, OAuth redirects, or public callbacks.

Keep the summary non-technical first. Lead with whether the app is now locally configured for Cloudflare deployment, then list any remaining owner actions.
