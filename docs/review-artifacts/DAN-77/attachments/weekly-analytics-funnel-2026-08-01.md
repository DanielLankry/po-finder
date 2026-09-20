# Po Finder weekly analytics and funnel report

**Reporting period:** 2026-07-26 through 2026-08-01 UTC  
**Prior period:** 2026-07-19 through 2026-07-25 UTC  
**Monthly baseline:** 2026-07-01 through 2026-07-31 UTC (DAN-65)  
**Prepared:** 2026-08-02 UTC

## Executive readout

This was not a validated growth week. Po Finder recorded 37 consented production pageviews, up 429% week over week, but all 37 came from one direct visitor during a single day. That visitor repeatedly traversed the owner-acquisition route—homepage, pricing, registration, and contact—and reached registration but not billing. Unique visitors fell from two to one, returning visitors fell from one to zero, and no external acquisition channel appeared in the current period.

The traffic spike is therefore best treated as likely operator, QA, or high-intent single-person activity rather than market demand. This is an inference, not an identity determination. The configured PostHog test-account filter was enabled, but the monthly baseline previously showed that enabling or disabling it did not change totals.

No paid-acquisition or broader launch decision should be made from this sample. The highest-value next move remains instrumentation and exclusion QA, followed by obtaining authoritative Search Console and aggregate Supabase reporting access.

## Scorecard

| Metric | Current week | Prior week | WoW | July baseline | Confidence |
|---|---:|---:|---:|---:|---|
| Consented pageviews | 37 | 7 | +428.6% | 121 | High for captured PostHog traffic |
| Unique visitors | 1 | 2 | -50.0% | 7 | High for captured PostHog traffic |
| Pageviews per visitor | 37.0 | 3.5 | +957.1% | 17.3 | High calculation; low behavioral representativeness |
| First-time visitors | 1 | 1 | 0.0% | Not separately baselined | Medium |
| Returning visitors | 0 | 1 | -100.0% | Not separately baselined | Medium |
| Homepage funnel entrants | 1 | 2 | -50.0% | 6 | High for route funnel |
| Reached pricing after homepage | 1 | 0 | — | 3 | High count; very low inference confidence |
| Reached registration after pricing | 1 | 0 | — | 1 | High count; very low inference confidence |
| Reached billing after registration | 0 | 0 | No change | 0 | High for captured route views |
| Direct traffic share | 100% | 71.4% of views | +28.6 pp | 72.7% of views | High for captured referrer values |
| Search impressions / clicks | Unavailable | Unavailable | — | Unavailable | None without Search Console |
| Google-indexed pages | Unavailable | Unavailable | — | Unavailable | None without Search Console |
| URLs exposed in live sitemap | 2 | 2 at monthly review | No change | 2 | High |
| Listing interactions / outbound leads | Unavailable | Unavailable | — | Unavailable | None without aggregate database read |

The current week contributed 30.6% of July's pageviews but only 14.3% of July's visitors. That concentration is the central finding; the pageview growth rate does not represent audience growth.

## Traffic pattern and anomaly

All 37 current-period pageviews occurred on 2026-07-29. The other six days recorded zero pageviews. One visitor generated every view, producing 37 views per visitor versus 3.5 in the prior week.

This pattern is anomalous because:

- volume rose by 30 pageviews while the visitor count fell by one;
- a single visitor reloaded or revisited registration 13 times and pricing 12 times;
- no referring domain, search engine, or tagged campaign appeared;
- the visitor completed the route sequence through registration within approximately one second, then did not reach billing;
- the prior week also contained admin and dashboard routes, showing that operator-like traffic remains mixed into the small audience.

The evidence is consistent with QA, operator use, or a registration-flow problem, but it cannot distinguish among them. Session replay, validated internal-traffic exclusions, and completion events would be needed to diagnose intent.

## Top pages

### Current week

| Route | Pageviews | Share of views | Unique visitors | Interpretation |
|---|---:|---:|---:|---|
| `/auth/register` | 13 | 35.1% | 1 | Repeated registration activity; investigate friction or QA |
| `/pricing` | 12 | 32.4% | 1 | Repeated pricing review in the same journey |
| `/` | 6 | 16.2% | 1 | Single homepage entrant with repeat views |
| `/contact` | 6 | 16.2% | 1 | Contact intent is possible, but no submitted-lead event is available |

### Prior week

| Route | Pageviews | Unique visitors |
|---|---:|---:|
| `/` | 3 | 2 |
| `/admin/login` | 2 | 1 |
| `/dashboard/schedule` | 1 | 1 |
| `/pricing` | 1 | 1 |

The current route mix shifted from a small blend of public and operator surfaces to one concentrated owner-acquisition journey. Pageview counts should not be read as four independent audiences because every current route was visited by the same person.

## Funnel and drop-off

The ordered route funnel uses distinct people, permits intervening events, and requires completion within seven days.

| Step | Current | Step conversion | Prior | Step conversion | July baseline |
|---|---:|---:|---:|---:|---:|
| Homepage | 1 | 100% | 2 | 100% | 6 |
| Pricing | 1 | 100% | 0 | 0% | 3 |
| Registration | 1 | 100% | 0 | — | 1 |
| Billing | 0 | 0% | 0 | — | 0 |

The observed drop-off moved downstream from homepage-to-pricing in the prior week to registration-to-billing in the current week. This is useful for locating the last observed route, but a one-person funnel cannot estimate conversion. It also measures page visits rather than verified registration, checkout, or payment completion.

## Returning users

The current visitor was first seen during the current week, so current returning visitors were zero. In the prior week, one of two visitors was first-time and one was returning. A weekly retention query found no week-one return from the 2026-07-19 first-time cohort.

These counts are exact within the consented PostHog population but too small to support a retention conclusion.

## Channel performance

| Channel / referrer | Current pageviews | Current visitors | Prior pageviews | Prior visitors | Readout |
|---|---:|---:|---:|---:|---|
| Direct / unattributed | 37 | 1 | 5 | 1 | 100% of current activity; attribution absent |
| Facebook referral | 0 | 0 | 2 | 1 | Prior referral did not repeat |
| Google / organic referral | 0 | 0 | 0 | 0 | No captured weekly organic visit; impressions remain unknown |
| Tagged campaigns | 0 observed | 0 | 0 observed | 0 | No current campaign evidence |

Direct traffic here includes genuinely direct visits and traffic where referrer or campaign parameters were lost. With one visitor and no UTM values, channel performance cannot be ranked beyond stating that no external acquisition source was captured.

## Search and indexation

The live `robots.txt` allows ordinary search indexing and points to `https://pokarov.co.il/sitemap.xml`. The live sitemap returned HTTP 200 and exposed two URLs: the homepage and `/about`, unchanged from the July review.

The sampled `site:pokarov.co.il` search on 2026-08-02 returned no first-party Po Finder result. This is a directional discovery check, not an indexed-page count. Search impressions, search clicks, queries, positions, submitted-versus-indexed status, and indexing errors are unavailable without Google Search Console.

## Listing interactions, outbound clicks, and leads

The active PostHog event taxonomy exposed only `$pageview` for Po Finder; it did not expose the repository-defined conversion events or server-side listing actions. No business-detail route appeared in the current or prior top pages.

Po Finder stores business detail views and call, WhatsApp, and directions clicks in the private `business_analytics_events` table after consent. A read-only aggregate Supabase query was requested during this review but was not approved, so those counts, live-listing inventory, registration completion, payment attempts, and purchases remain unavailable. Zero must not be inferred from missing access.

## Opportunities and actions

1. **Treat the July 29 burst as a tracking/flow investigation, not growth.** Validate whether the visitor was operator/QA traffic and inspect registration-to-billing behavior. Success: known internal activity is excluded and each real funnel event emits once.
2. **Add canonical completion events to the weekly scorecard.** Reconcile `registration_completed`, `business_draft_created`, `checkout_started`, and `listing_purchased` against server records. Success: route and server counts reconcile for a controlled QA journey.
3. **Restore decision-grade listing and lead reporting.** Expose privacy-safe weekly aggregates for listing views, call, WhatsApp, directions, and contact submissions. Success: counts are available without row-level business or user data.
4. **Obtain Search Console read access.** Replace sitemap/search-result proxies with impressions, clicks, CTR, average position, indexed pages, excluded pages, and query/page breakdowns. Success: current and prior complete-week exports reconcile to the property UI.
5. **Keep acquisition spend at zero.** Revisit only after at least 10 fresh verified listings exist in one wedge, instrumentation reconciles, and at least 30 qualified discovery sessions are observed.

## Exact least-privilege access required

No passwords or tokens are requested.

- **Google Search Console:** add the reporting identity as a **Restricted user** on the `sc-domain:pokarov.co.il` property (or the exact `https://pokarov.co.il/` URL-prefix property if that is the verified property). Required read surfaces: Performance search results and Page indexing / Sitemaps. This is sufficient for report exports; owner access is not required.
- **Supabase Po Finder (`ymqlqdhelsocibhnanjy`):** approve read-only aggregate SQL for the existing connector, limited to weekly `COUNT`/`COUNT DISTINCT` results from `business_analytics_events`, `businesses`, and `payment_attempts`. Prefer granting `SELECT` on dedicated reporting views that expose week, event type, status, and aggregate counts only; do not expose emails, phone numbers, tokens, payment payloads, owner IDs, or row-level visitor identifiers.

## Sources and method

- PostHog project 149309, UTC timezone, host exactly `pokarov.co.il`, configured test-account filter enabled.
- Trends queries used complete UTC weeks and weekly aggregation for distinct visitors.
- First-time visitors used PostHog `first_time_for_user`; returning visitors equal weekly unique visitors minus first-time visitors.
- Funnel: `$pageview` routes `/` → `/pricing` → `/auth/register` → `/dashboard/billing`, ordered within seven days, aggregated by person.
- Live probes on 2026-08-02: `robots.txt`, `sitemap.xml`, homepage metadata, and sampled `site:pokarov.co.il` / brand search.
- Monthly baseline: DAN-65 reviewed July export and source notes.

## Confidence and limitations

The PostHog counts are reproducible and internally reconciled, so confidence is high in what the consented dataset contains. Confidence is low in behavioral and channel conclusions because the current population is one visitor, test/operator exclusion is unvalidated, activity is concentrated on one day, only route pageviews are available, and privacy consent means PostHog is not a census of all traffic. Search, indexation, listing, lead, and payment metrics remain explicitly unmeasured pending the least-privilege access above.
