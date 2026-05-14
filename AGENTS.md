# Repository Guidelines

## Project Structure & Module Organization
`app/` contains the Next.js 16 App Router code: public pages, auth, admin, dashboard flows, and `app/api/*` route handlers. Reusable UI lives in `components/`, with domain groups such as `components/business`, `components/layout`, `components/map`, and `components/ui`. Shared logic and integrations live in `lib/`, including Supabase clients, DB helpers in `lib/db/`, payment code, analytics, and utility functions. Static assets are in `public/`. Database migrations are tracked in `supabase/migrations/`. End-to-end coverage lives in `tests/`, split into `public`, `auth`, `destructive`, and `utils`.

## Build, Test, and Development Commands
Use `npm run dev` to start local development on `http://localhost:3000`. Use `npm run build` to verify the production bundle, and `npm run start` to serve that build. Run `npm run lint` before opening a PR; it uses the repo’s ESLint config for Next.js and TypeScript. Supabase workflows use the packaged scripts, for example `npm run db:diff`, `npm run db:push`, and `npm run db:gen-types`.

## Coding Style & Naming Conventions
This codebase uses TypeScript with strict mode, React function components, and the `@/*` path alias. Follow the existing style: 2-space indentation, semicolons, and double quotes. Use `PascalCase` for component files (`Navbar.tsx`), `camelCase` for functions and hooks, and Next route folder naming for pages (`app/auth/login/page.tsx`). Keep shared helpers in `lib/` instead of embedding them in route files. There is no dedicated formatter config here, so match surrounding code and rely on `npm run lint` for enforcement.

## Testing Guidelines
Tests are Playwright-first. Name specs `*.spec.ts` under `tests/<area>/`. Public route, auth, and SEO coverage already live under `tests/public` and `tests/auth`; destructive paid/unpaid business flows are isolated under `tests/destructive`. Run Playwright with `npx playwright test`. Set `PLAYWRIGHT_BASE_URL` when targeting a non-default environment.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commit style such as `fix(payments): ...`, `fix(ux): ...`, and `diag(payments): ...`. Keep that format for new commits. PRs should include a short problem statement, the concrete user-facing change, any required env or migration steps, and screenshots for visible UI updates. Link the relevant issue or task when one exists.

## Security & Configuration Tips
Keep secrets in `.env.local` only; use `.env.local.example` as the template for new variables. Do not commit generated credentials, production URLs, or Supabase service-role secrets. Treat files under `tests/destructive/` as state-changing and run them only against disposable or explicitly approved environments.

## Launch Notes
Next.js 16 uses `proxy.ts` for request guarding and Supabase session refresh; do not reintroduce `middleware.ts`. Visible Hebrew branding should remain `פה קרוב`, while `pokarov.co.il` is reserved for domains, email addresses, and technical identifiers.
