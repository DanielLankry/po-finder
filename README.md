# פה קרוב (Pokarov)

`פה קרוב` is a Hebrew-first local business discovery platform built with
Next.js, Supabase, Google Maps, and HYP payments. Visitors can discover nearby
businesses; owners can purchase a time-limited listing and manage its public
profile from the dashboard.

## Local development

Requirements:

- Node.js 20 or newer
- npm
- A Supabase project and the external service credentials listed in
  [`.env.local.example`](.env.local.example)

Install dependencies and start the development server:

```bash
npm ci
cp .env.local.example .env.local
npm run dev
```

The application is served at [http://localhost:3000](http://localhost:3000).
Keep real credentials in `.env.local`; never commit them.

## Verification

```bash
npm run docs:links
npm run lint
npm run typecheck
npm test
npm run build
```

Playwright suites are run separately with `npx playwright test`. Tests under
`tests/destructive/` change Supabase state and must only target a disposable or
explicitly approved environment.

## Repository map

| Path | Purpose |
| --- | --- |
| `app/` | Next.js App Router pages and API route handlers |
| `components/` | Reusable UI grouped by product domain |
| `lib/` | Shared domain logic and external integrations |
| `public/` | Static browser assets |
| `supabase/migrations/` | Ordered database migrations |
| `tests/` | Node and Playwright test suites |
| `docs/` | Active documentation and preserved historical material |

Start with the [documentation index](docs/README.md) for compliance, quality
evidence, project history, and archived plans. Contributor
and agent conventions live in [AGENTS.md](AGENTS.md).

## Database and deployment

Useful Supabase commands are exposed as `npm run db:*` scripts. Database
migrations, production deployments, secrets, and paid-service changes require
explicit approval. Next.js request guarding and Supabase session refresh live in
`proxy.ts`; do not add `middleware.ts`.
