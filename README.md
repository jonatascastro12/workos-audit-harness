# workos-audit-chat

**Live:** [https://cd26-workos-audit-chat.workos.tools](https://cd26-workos-audit-chat.workos.tools)

A demo [React Router 7](https://reactrouter.com) application that deploys to [Cloudflare Workers](https://developers.cloudflare.com/workers/) using the [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/). It uses [Cloudflare Workflows](https://developers.cloudflare.com/workflows/) for background jobs and the [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) for model access. CI/CD is handled by GitHub Actions — merges to `main` automatically build, run migrations, and deploy.

## Prerequisites

Install `cloudflared`:

```bash
brew install cloudflared
```

Install the Doppler CLI (no working npm package — Doppler deprecated theirs):

```bash
brew install dopplerhq/cli/doppler
doppler login
doppler setup --project workos-audit-chat --config dev
```

Install dependencies:

```bash
npm install
```

Log in to Cloudflare via Wrangler:

```bash
npx wrangler login
```

## Database Setup

If you used `npm run rename-app` above, the D1 database has already been created and its id written into the wrangler configs — skip to running migrations.

Otherwise, create the D1 database manually:

```bash
npx wrangler d1 create your-app-db
```

Copy the `database_id` from the output and paste it into both `wrangler.toml` and `wrangler.worker.toml` under the `[[d1_databases]]` section.

Run migrations locally:

```bash
npm run db:migrate:local
```

> **Note:** Wrangler handles D1 emulation. No Docker DB is necessary. `npm run dev` also auto-applies pending migrations via a `predev` hook, so this manual step is only needed for re-applying or running migrations without starting the dev server.

## Local Development

> **TODO:** The `dev` script in `package.json` is temporarily pointing at the `claude-day` Doppler project. Revert this back to `workos-audit-chat` when no longer needed.

```bash
# For the React Router app (http://localhost:5173)
npm run dev

# For the Workflow worker (curl http://localhost:8787 to trigger workflow)
npm run dev:worker
```

Open [http://localhost:5173](http://localhost:5173) to see the app.

## Design system

This app vendors the WorkOS design system under `app/vendor/design-system` because `@workos-inc/design-system` is private to the `workos/workos` monorepo and is not published to npm. Import design-system primitives from `@workos-inc/design-system/components/*` or `~/vendor/design-system/components/*` and prefer them over custom UI.

The setup mirrors the external-repo pattern in `horizon-web-ui`:

- `app/app.css` imports the vendored WorkDS theme and component CSS.
- `app/root.tsx` wraps the app in the vendored `Theme` component.
- `tsconfig.cloudflare.json` aliases `@workos-inc/design-system` to the vendored package.
- `postcss.config.mjs` compiles the WorkDS breakpoint/custom-media CSS.

See `AGENTS.md` for agent-facing UI rules and validation commands.

To refresh the vendored copy from a local `workos/workos` checkout:

```bash
npm run sync-design-system -- ../workos/packages/design-system
npm install
npm run verify
```

Commit the generated vendored diff through a normal PR so each internal app updates intentionally instead of drifting silently.

## Cloudflare Access (Post-Deploy)

After the app has been deployed for the first time, authenticate with Cloudflare Access so you can reach it:

```bash
cloudflared access login cd26-workos-audit-chat.workos.tools
```

## Deployment model (Workers for Platforms)

This app does **not** own a Cloudflare custom domain. It deploys into the
`workos-tools-apps` **dispatch namespace** and is served via the zone's wildcard
route → the `workos-tools-dispatch` router → a `ROUTES` KV lookup
(`subdomain → namespaced script name`). This is how internal apps avoid
Cloudflare's 100-custom-domains-per-zone limit.

On push to `main`, CI builds, runs migrations, deploys with
`wrangler deploy --dispatch-namespace workos-tools-apps`, syncs secrets via the
Cloudflare API (**after** deploy — `wrangler secret bulk` has no
`--dispatch-namespace`, and a namespaced script must exist first), and registers
`subdomain → script` in the `ROUTES` KV (`--remote` is required). No per-app DNS
record or Worker route is needed — the zone wildcard handles it.

To deploy manually:

```bash
npm run deploy          # React Router app -> dispatch namespace
npm run deploy:worker   # Workflow worker (normal Worker, no domain)
```

> **Build-time env:** any client-exposed `VITE_*` var is inlined by Vite at
> **build** time, so it must be set in Doppler before `npm run build` runs — a
> missing one bakes in empty and only fails at runtime.

## Logs & Deployments

```bash
npm run logs:worker          # tail the Workflow worker (a normal Worker)
npm run deployments:worker   # list recent deployments of the Workflow worker
```

> **`wrangler tail` / `npm run logs` does NOT work for the app worker** once it
> lives in the dispatch namespace — `wrangler tail` rejects namespaced scripts
> ("Worker does not exist", code 10007). Use the **Cloudflare dashboard**
> observability for the app worker (`[observability]` is enabled). The companion
> workflow worker is a normal Worker, so `npm run logs:worker` still works.

## Converting an existing app

If you already have a local app and want to deploy it as a WorkOS internal app on Cloudflare, use the included conversion skill at `.claude/skills/convert-to-cloudflare-internal-app`.

See [docs/convert-existing-app.md](docs/convert-existing-app.md) for install commands and usage guidance.
