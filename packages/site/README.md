# @workos-inc/audit-harness-site

Marketing and documentation site for the
[WorkOS Audit Harness](https://github.com/jonatascastro12/workos-audit-harness).

Next.js 15 (App Router) + Tailwind CSS v4. Designed to deploy on Vercel.

## Develop

```bash
cd packages/site
npm install
npm run dev      # http://localhost:3030
```

## Build

```bash
npm run build
npm run start
```

## Deploy on Vercel

1. Import the `workos-audit-harness` repo in Vercel.
2. Set the project **Root Directory** to `packages/site`.
3. Framework preset: **Next.js** (auto-detected).
4. No environment variables are required.
