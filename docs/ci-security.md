# CI and Security Gates

The default CI workflow runs on pull requests and pushes to `master`.
It uses Node.js 24 LTS and Node.js 24-based action releases so the gates do not
depend on GitHub's retired Node.js 20 action runtime.

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

Additional repository automation:

- Dependabot opens weekly npm and GitHub Actions update pull requests.
- CodeQL scans JavaScript and TypeScript on pull requests, `master` pushes, and
  a weekly schedule.
- Gitleaks scans pull requests and `master` pushes for committed secrets.
  Historical HYP public-test fixtures are allowlisted by exact fingerprint in
  `.gitleaksignore`; new matches remain blocking.
