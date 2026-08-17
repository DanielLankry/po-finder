# CI and Security Gates

The default CI workflow runs on pull requests and pushes to `main`.

Local parity commands:

```bash
npm ci
npm run docs:links
npm run lint
npm run typecheck
npm audit --omit=dev --audit-level=moderate
npm test
npm run build
```

`npm run build` requires the public application environment variables listed in
`.env.local.example`. CI uses non-secret placeholders for the build-only check
and does not deploy, migrate, or contact Production.

Production dependency remediation is pinned in `package.json` `overrides`.
Keep `npm audit --omit=dev` at zero before removing or relaxing those pins.
