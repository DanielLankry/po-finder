# Core Web Vitals monitoring and performance budgets (DAN-263)

## Scope

- Add consent-aware field telemetry for Vercel Speed Insights.
- Track CWV budgets on `/`, `/pricing`, and `/auth/login`.
- Add repeatable synthetic fallback with route-level thresholds:
  - LCP < 2500 ms
  - INP < 200 ms (field goal; synthetic fallback uses TBT)
  - CLS < 0.1

## Field monitoring implementation

- `@vercel/speed-insights` is added as a runtime dependency and mounted from `components/providers/ConsentAnalytics.tsx`.
- Speed Insights is rendered only when the user has explicitly accepted optional cookies (`po-cookie-consent === "accepted"`), matching the existing analytics consent model used for Vercel Analytics and Meta Pixel.
- A `beforeSend` filter rechecks consent for every queued metric and drops the event if consent is no longer accepted.
- Consent changes are handled by existing `po-cookie-consent-accepted` and `po-cookie-consent-declined` events. Revoking previously accepted consent reloads the current page so already-loaded telemetry code is fully removed; the declined choice is persisted before reload.
- Evaluate production mobile P75 for each of `/`, `/pricing`, and `/auth/login` against the same field budgets: LCP < 2500 ms, INP < 200 ms, and CLS < 0.1.
- Dashboard enablement and deployment are intentionally not part of DAN-263. If Speed Insights is disabled for the Vercel project, enabling it remains an environment change that requires recorded Daniel approval.

## Privacy assessment

- Speed Insights is listed in the privacy policy under third-party providers and links to [Vercel's Speed Insights privacy disclosure](https://vercel.com/docs/speed-insights/privacy-policy).
- It is documented as consent-gated, and enabled only under the same cookie banner consent state as other non-essential tracking.
- Vercel documents its Speed Insights data points as anonymous and not tied to an individual visitor or IP address. Stored dimensions can include route/path, network speed, browser, device type and OS, country, the measured vital and element attribution.
- No explicit identifier or personal identifier is passed by this site integration.

## Synthetic fallback

- Added `lighthouserc.cjs` with synthetic collection on:
  - `/`
  - `/pricing`
  - `/auth/login`
- Lighthouse uses its default mobile throttling profile and records three runs per route; budget assertions use the median run.
- Run against production via `npm run perf:baseline`. The script fetches the pinned `@lhci/cli@0.15.1` runner on demand, avoiding a permanent vulnerable Lighthouse dependency tree in application installs.
- To audit another already-running environment, set `LHCI_BASE_URL`, for example `LHCI_BASE_URL=http://127.0.0.1:3000 npm run perf:baseline`.
- Added CI workflow `.github/workflows/performance-budget.yml` with:
  - Trigger: manual dispatch and weekly Monday run
  - Lighthouse budget checks against `https://pokarov.co.il`
  - Upload of `.lighthouseci` artifacts for auditability

## Production synthetic baseline — 2026-08-26

Lighthouse 12.6.1 collected three mobile-throttled runs per route against `https://pokarov.co.il` from 05:37–05:40 UTC. The table reports the median of each route's three runs. TBT is the lab responsiveness proxy; Lighthouse does not produce INP.

| Route | LCP median | CLS median | TBT median | Performance median | Budget result |
| --- | ---: | ---: | ---: | ---: | --- |
| `/` | 7668 ms | 0.002874 | 611 ms | 60 | Fail: LCP, TBT |
| `/pricing` | 4085 ms | 0.000059 | 446 ms | 75 | Fail: LCP, TBT |
| `/auth/login` | 4167 ms | 0 | 314 ms | 79 | Fail: LCP, TBT |

CLS passed the 0.1 budget on every route. Field INP is unavailable before the consent-gated code is deployed, the Vercel project feature is enabled, and enough opted-in production traffic is collected. Raw run values and provenance are retained in [`core-web-vitals-baseline-2026-08-26.json`](./core-web-vitals-baseline-2026-08-26.json).

## Alert and review cadence

- The scheduled workflow runs at 06:00 UTC each Monday and can also be started manually.
- Any route exceeding LCP 2500 ms, CLS 0.1, or the 200 ms TBT proxy fails the workflow; the failed GitHub Actions check is the alert. Review its uploaded `.lighthouseci` artifacts immediately and open a route-specific performance issue.
- Each Monday after field data becomes available, review production mobile P75 in Speed Insights for all three routes over the longest stable comparison window available (target: trailing 28 days). Record LCP, INP, CLS, sample volume, and the prior-period delta. Open a performance issue when a field budget misses in two consecutive weekly reviews, or immediately for a material regression tied to a deployment.
- Monthly privacy review:
  - confirm consent events still gate Speed Insights rendering
  - confirm policy text remains aligned with active vendor usage
  - confirm synthetic output for the three routes remains within tolerance

## Follow-up

- After an approved deployment and any required Vercel dashboard enablement, collect the first route-level field baseline once each route has enough opted-in data for a stable P75. This is an operational follow-up, not authorization to deploy or change the Vercel environment.
