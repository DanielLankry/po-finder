# Po Finder — Governed Meta Ads Management Plan

**Owner:** Growth operator (Pulse)
**Approver:** Po Finder budget owner / business owner
**Prepared:** 2026-07-28
**Scope:** Planning only. This document does not authorize account changes, campaign creation, billing changes, audience uploads, or spend.

This plan supersedes the archived [advertising strategy](../archive/marketing/2026-03/ads-strategy.md),
[budget plan](../archive/marketing/2026-03/budget-plan.md),
[campaign architecture](../archive/marketing/2026-03/campaign-architecture.md),
[simplified ads plan](../archive/marketing/2026-03/simple-ads-plan.md), and
[tracking setup](../archive/marketing/2026-03/tracking-setup.md). Those documents
remain useful as creative source material, but their subscription, price,
domain, tracking-readiness, and campaign-structure assumptions are stale. Po
Finder now sells one-time listing durations in ILS, uses `pokarov.co.il`, and
already has consent-aware browser events.

## 1. Decision summary

Run no ads until Gates G0–G2 are explicitly approved. When approved, the safest
first paid test is one business-owner acquisition campaign, one ad set, and
three static creative angles for 14 days. Use a **210–280 ILS lifetime budget**
(15–20 ILS/day equivalent), a **280 ILS campaign lifetime cap**, and a
**300 ILS ad-account spending limit for the test window**. Do not split this
small budget across consumer, event, retargeting, or lookalike campaigns.

The primary optimization event is `Lead`, which the current product fires only
after a first business draft is successfully inserted. The business KPI is not
Meta-reported leads, however: it is **verified succeeded listing purchases and
gross ILS from the payment database**, reconciled to consented PostHog sessions
and Meta reporting.

This first test is a funnel-validation test, not a scale decision and not a
statistically powered causal experiment. It should answer:

1. Can relevant Israeli business owners be brought to the site at a reasonable
   landing-page cost?
2. Do they create real business drafts?
3. Does the draft-to-checkout-to-purchase funnel work for paid traffic?
4. Which message earns the strongest directional response?

## 2. Non-negotiable authority boundary

Pulse may, after receiving the applicable approval:

- inspect account configuration and read reports;
- prepare draft campaign structures, creative, UTMs, and automated rules;
- publish only the exact approved campaign version;
- pause campaigns when a stop condition is met; and
- produce daily anomaly notes and weekly/final reports.

Pulse may not:

- add or change a payment method;
- remove or raise an account or campaign spending limit;
- increase a budget, extend an end date, duplicate a live campaign, or enable an
  additional campaign without a new approval;
- upload customer lists, use sensitive targeting, enable advanced matching, or
  implement Conversions API (CAPI) without privacy and technical approval;
- grant account access, change administrators, or weaken two-factor
  authentication;
- publish materially new claims, prices, testimonials, or creative outside the
  approved batch; or
- optimize toward an event that has not passed the measurement QA in this plan.

Pausing for safety is always allowed. Resuming after a safety pause requires the
budget owner’s approval.

## 3. Roles and least privilege

| Role | Minimum access | Responsibilities |
|---|---|---|
| Budget owner | Business/admin plus finance authority | Owns billing, final budget, account limit, launch, scaling, and resumption approvals |
| Pulse | Advertiser/campaign manager; no finance or user-admin rights | Drafts, launches approved version, monitors, pauses, reports |
| Technical owner | Pixel/data-source access plus application access | Verifies events, consent, domain, purchase truth, and any later CAPI work |
| Privacy reviewer | No ad-account access required | Approves notice, data sharing, retention, audience sources, and any CAPI/advanced matching |
| Creative approver | Read/review access | Verifies Hebrew copy, factual claims, price, visual rights, and landing-page match |

Require individual accounts, two-factor authentication, no shared credentials,
and quarterly access review. The budget owner retains at least two recovery
administrators. Record every approved change in the issue or change log; Meta’s
Ads Manager activity history is supporting evidence, not the sole record.

## 4. First-test campaign framework

### 4.1 Objective and funnel

**Campaign objective:** Leads
**Conversion location:** Website
**Performance goal:** Maximize conversions
**Optimization event:** `Lead`
**Bid strategy:** Highest volume, with no bid/cost cap in the first bounded test
**Placements:** Advantage+ placements, subject to creative preview QA
**Schedule:** Fixed 14-day start/end; no “always on” setting
**Budget:** 210–280 ILS lifetime; exact amount selected at G1

Meta describes Leads as an available performance objective and recommends
choosing an objective that matches the desired outcome. Traffic is intended
when the downstream action is difficult to track; Po’s real lead is trackable,
so Traffic is a fallback diagnostic, not the default. Meta also notes that
budget should cover at least roughly a week of learning and that lifetime
budgets bound total campaign cost even when daily delivery varies.

The measurement funnel is:

| Stage | Event / source | Decision use |
|---|---|---|
| Ad delivery | Meta impressions, reach, frequency, spend | Delivery and pacing |
| Click | Meta link click + outbound CTR | Creative response |
| Landing visit | Meta landing-page view; consented PostHog `$pageview` with UTM | Destination health |
| Registration | `CompleteRegistration` | Supporting only; query-marker based and not authoritative |
| Real lead | `Lead` after first successful business-draft insert | Optimization and primary funnel KPI |
| Checkout | `InitiateCheckout` after checkout URL is returned | Funnel diagnosis |
| Purchase | Consent-aware Pixel `Purchase`, PostHog `listing_purchased`, and succeeded payment row | Revenue truth; DB is authoritative |

Do not optimize the first test for `Purchase`: purchase volume is expected to be
too sparse. Promote `Purchase` to the optimization event only after a later
review confirms stable event quality and sufficient volume.

### 4.2 Audience hypotheses

The first test targets prospects, not existing customers.

**H1 — Broad local operators (first test):**

- Location: Israel; begin with the Central District / Tel Aviv service area only
  if supply density and onboarding support are actually strongest there.
- Age: 25–55 as an initial hypothesis, not a protected-trait inference.
- Language: Hebrew creative; do not require a language filter unless delivery
  QA shows a clear mismatch.
- Detailed targeting: broad/Advantage+ audience with only location and age
  controls, if the account supports that setup.
- Exclusions: current purchasers if a compliant, reliable exclusion audience
  exists; otherwise accept minimal overlap and report it.

**H2 — Small-business interest bundle (sequential challenger):**

- Same geography and age.
- A compact, pre-approved interest bundle around small business,
  self-employment, entrepreneurship, and relevant local-business categories.
- Run only after H1’s 14-day readout or with a separately approved budget. Do
  not split the first 210–280 ILS between H1 and H2.

**H3 — First-party purchaser lookalike (future):**

- Only after privacy approval, a documented lawful source, sufficient seed
  quality/size, suppression rules, and a separate approval.
- Never upload business contacts scraped from listings, public pages, or
  third-party sources.

Prohibited targeting includes inferred health, religion, politics, ethnicity,
sexual orientation, financial distress, or other sensitive traits. Do not use
precise geofences around sensitive places. This campaign is not housing,
employment, credit, or political advertising; if the offer changes, re-check
Meta’s Special Ad Category requirements before launch.

### 4.3 Creative and test structure

One ad set contains three approved static ads:

| Cell | Hypothesis | Visual | Claim constraint |
|---|---|---|---|
| C01 — Visibility | Owners respond to “be discoverable locally” | Real Po map/profile screenshot | Do not claim traffic volume or guaranteed customers |
| C02 — Control | Owners value simple listing control | Real profile, hours, photos, and event UI | Show only live features |
| C03 — Price/value | A clear duration offer reduces uncertainty | Current pricing card plus product UI | Pull exact ILS price/duration from the live pricing page at approval time |

Create 1:1 feed and 9:16 story/reel-safe variants from the same concept. Check
RTL rendering, safe zones, legibility, destination URL, and placement previews.
Every image, logo, testimonial, and business photo must have documented usage
rights. Testimonials and counts require source evidence and approval.

This structure is **exploratory** because Meta may allocate delivery unevenly.
Report spend and results by ad, but do not call a creative a causal “winner”
unless a later Meta A/B test is separately funded and approved. Do not make
creative edits in place after launch; create a versioned replacement so history
remains intelligible.

## 5. Naming, URL, and version conventions

Use ASCII, stable tokens, and no personal data:

```text
Campaign: PO_IL_BIZ_LEAD_PROSPECT_CENTRAL_2026Q3_T01
Ad set:   AS_BROAD_25-55_CENTRAL_V01
Ad:       AD_C01_VISIBILITY_STATIC_1X1_HE_V01
Rule:     RULE_PAUSE_T01_SPEND_280ILS
Report:   PO_META_2026Q3_T01_W01
```

Required URL template:

```text
https://pokarov.co.il/pricing
  ?utm_source=meta
  &utm_medium=paid_social
  &utm_campaign=po_il_biz_lead_prospect_central_2026q3_t01
  &utm_content=c01_visibility_static_v01
  &utm_term=broad
```

Use lowercase snake case in UTM values. Preserve the same `utm_campaign` for
the test; change only `utm_content` by creative and `utm_term` by audience.
Never put names, emails, phone numbers, or other personal data in names or URLs.
Record Meta campaign/ad-set/ad IDs beside these names after creation.

## 6. Measurement and attribution plan

### 6.1 Source of truth hierarchy

1. **Payments:** succeeded `payment_attempts` rows owned by the authenticated
   user, including amount, currency, product code, and attempt ID.
2. **Product funnel:** PostHog consented events and sessions.
3. **Delivery:** Meta Ads Manager spend, impressions, reach, frequency, clicks,
   landing-page views, and attributed events.

Meta is the optimization/reporting system, not the revenue ledger. Never report
Meta-attributed Purchase value as booked revenue without payment reconciliation.

### 6.2 Attribution views

Keep Meta’s approved account attribution setting fixed for the whole test;
record it in the launch sheet. Recommended reporting view: **7-day click and
1-day view**, if available in the account. Also report **1-day click** as a
conservative sensitivity view. Never change the attribution setting mid-test.

First-party reporting uses:

- direct UTM/session attribution for consented sessions;
- a last paid Meta touch within 7 days as a secondary analytical view, if
  PostHog can reliably provide it; and
- “unattributed” rather than guessed attribution when consent or identity
  continuity is absent.

Expected reasons for disagreement include consent refusal, ad blockers,
cross-device journeys, view-through attribution, timezone, and reporting delay.
Use Asia/Jerusalem and ILS in both Meta and internal reports.

### 6.3 Required metrics

| Layer | Metrics |
|---|---|
| Delivery | Spend, reach, impressions, frequency, CPM |
| Traffic | Link clicks, outbound CTR, CPC, landing-page views, cost/LPV, LPV/link-click ratio |
| Funnel | Registrations, real Leads, CPL, checkouts, lead-to-checkout rate |
| Business | Succeeded purchases, gross ILS, cost/purchase, ROAS, lead-to-purchase rate |
| Quality | Refunds/failures when available, duplicate event rate, event match/diagnostic warnings |

Do not treat likes, post engagement, reach, or Meta’s modeled conversions as
business success.

### 6.4 Reporting cadence

**Daily safety check (operator):** spend/pacing, active assets, billing anomaly,
policy status, broken URLs, event flow, and automated-rule history.

**Twice-weekly optimization note:** by-ad delivery, CTR, LPV rate, Leads,
checkouts, purchases, anomalies, and “no change” or the approved action.

**Final readout:** 14-day totals plus a 72-hour conversion-lag window; funnel by
creative, Meta vs first-party reconciliation, decision, risks, and a proposed
next test. No scale action is implied by the report.

## 7. Tracking readiness and privacy assessment

### 7.1 Verified in the repository

At repository commit `85277d1`:

- `lib/meta-pixel.ts` loads Meta’s script only after
  `po-cookie-consent=accepted`, grants/revokes consent, and removes accessible
  `_fbp`/`_fbc` cookies on decline.
- `components/providers/MetaPixelProvider.tsx` tracks App Router `PageView` and
  consent-aware `CompleteRegistration`.
- `app/dashboard/profile/page.tsx` sends `Lead` after the first successful
  business draft insert.
- `app/dashboard/billing/BillingClient.tsx` sends `InitiateCheckout` only after
  the checkout API returns a URL.
- `app/dashboard/billing/page.tsx` verifies that the signed-in user owns a
  succeeded payment before exposing Purchase data.
- `BillingClient.tsx` sends Pixel and PostHog Purchase events with ILS value,
  plan code, and payment-attempt ID; the Meta `eventID` is the payment-attempt
  ID and browser storage prevents routine repeat sends.
- No raw `noscript` pixel bypasses the JavaScript consent decision.

**Assessment:** browser Pixel is **code-ready but not launch-verified**. The
account/data-source ownership, production environment value, domain
verification, Event Manager diagnostics, consent behavior in production, and
end-to-end test event receipt remain G0 requirements.

### 7.2 Known gaps and cautions

- CAPI is not implemented.
- `NEXT_PUBLIC_META_PIXEL_ID` has an in-code fallback. G0 must verify that the
  production ID is explicitly configured and belongs to Po Finder; do not rely
  on the fallback.
- `CompleteRegistration` is triggered from an allowlisted URL marker and is a
  supporting metric, not authoritative registration truth.
- Browser events necessarily miss users who decline optional tracking or block
  the script. Do not “correct” reported conversion counts by inventing a factor.
- UTMs are visible in consented page URLs, but cross-session paid attribution
  should be tested before relying on it.
- No customer-list audience, advanced matching, or server-side marketing data
  sharing is approved by this plan.

### 7.3 CAPI decision

CAPI is **not required for the bounded first test** and must not delay a
Pixel-only launch once G0 passes. A later CAPI proposal needs its own technical
and privacy review and must:

- honor the same consent boundary; server-side delivery must never bypass a
  decline;
- document every field sent to Meta and its retention/lawful basis;
- minimize and hash contact identifiers where Meta requires hashing;
- reuse the browser `eventID`/payment-attempt ID and matching `event_name` for
  deduplication;
- send Purchase only from the authoritative succeeded-payment transition;
- keep secrets server-side, rate-limit/retry safely, and log response metadata
  without logging personal data; and
- pass Meta Test Events, duplicate-event, data-quality, and consent-revocation
  QA before production.

Israel’s Privacy Protection Authority describes online identifiers as personal
information under Amendment 13 and maintains security obligations for entities
processing digital personal information. This plan is operational guidance, not
legal advice; the privacy owner must approve the notice, processor/data-transfer
position, retention, and any CAPI or first-party audience expansion.

## 8. Safeguards, caps, and automated controls

Before launch:

1. Enable two-factor authentication for all users and remove stale access.
2. Confirm Pulse has no finance or user-admin authority.
3. Set the ad account timezone to Asia/Jerusalem and currency to ILS.
4. Confirm the correct Page, Instagram identity, domain, and Pixel.
5. Set the exact 14-day campaign lifetime budget, never an open-ended daily
   budget.
6. Set an account spending limit of 300 ILS for the test window. If an account
   limit cannot be applied, do not launch until the budget owner accepts an
   equivalent first-class cap.
7. Create and test the following automated rules. Performance rules are
   notify-only; hard safety rules may pause.

| Rule | Window | Action |
|---|---|---|
| Campaign spend reaches 224 ILS (80% of max) | Lifetime | Notify Pulse + budget owner |
| Campaign spend reaches 266 ILS (95% of max) | Lifetime | Notify urgently; verify end date and active assets |
| Campaign spend reaches 280 ILS | Lifetime | Pause campaign |
| Spend today exceeds 25 ILS | Today | Pause and investigate pacing/configuration |
| Any unapproved campaign becomes active | Immediate/daily audit | Pause it and alert budget owner |
| Link active but destination fails or checkout is broken | Immediate manual check | Pause affected ads/campaign |

Meta notes that a daily budget is an average and daily delivery can exceed that
amount while averaging across a week; a fixed lifetime budget is therefore the
primary first-test campaign control. Account/campaign limits provide a second
layer. Automated-rule changes must appear in Meta’s activity history and the
internal change log.

## 9. Stop, hold, and scale conditions

### 9.1 Immediate safety stop

Pause immediately, preserve evidence, and notify the budget owner if any occurs:

- spend exceeds an approved cap, the end date changes, or an unknown asset runs;
- payment method, administrator, domain, Pixel, Page, or Instagram identity
  changes unexpectedly;
- suspected account compromise, phishing, or unauthorized access;
- landing page, registration, checkout, or payment flow is broken;
- Pixel loads before explicit consent, continues after decline, or sends to an
  unapproved data source;
- Purchase fires without a matching succeeded payment, wrong value/currency is
  sent, or duplicate Purchase rate exceeds 5%;
- a material privacy, copyright, misleading-claim, or ad-policy concern appears;
- an ad is rejected for a substantive policy reason; or
- Meta or first-party data becomes unreliable enough that spend cannot be
  measured.

### 9.2 Performance holds

Do not make performance changes in the first 72 hours unless a safety stop
applies. Thereafter:

| Condition | Minimum evidence | Action |
|---|---|---|
| Outbound CTR < 0.7% | ≥1,000 impressions on an ad | Pause that ad after review |
| LPV/link-click ratio < 70% | ≥50 link clicks | Pause and investigate page speed, redirect, or click quality |
| No `Lead` | ≥120 ILS spend and tracking QA still passes | Pause campaign; diagnose offer, audience, creative, and funnel |
| CPL > 80 ILS | ≥2 Leads | Hold; do not spend the remaining budget without owner approval |
| Frequency > 3.0 and CTR falls ≥30% from first 3 days | Ad-set level | Hold/refresh only with approved creative |

These are governance thresholds, not market benchmarks or guarantees. With such
a small sample, they prevent waste more reliably than they identify winners.

### 9.3 Scale gate

No automatic scaling. A second test or budget increase requires all of:

- event and payment reconciliation passes;
- no open safety/privacy/policy incident;
- at least 3 real Leads and at least 1 succeeded paid listing, or a budget-owner
  decision explicitly accepting a traffic/lead-only learning result;
- the proposed next hypothesis, exact budget, dates, assets, and cap are written;
- the landing-to-Lead and Lead-to-Purchase drop-offs are understood; and
- G4 is approved.

Increase any later budget by at most 20% per change and never more than once in
72 hours. That is a pacing rule, not standing authority.

## 10. Anomaly alert matrix

| Signal | Threshold | Owner | Response SLA |
|---|---|---|---|
| Spend pacing | >125% of straight-line lifetime pace or >25 ILS/day | Pulse | Same day; pause if cap risk |
| Zero paid LPVs | >25 Meta link clicks and zero matching paid landing sessions/LPVs | Pulse + technical owner | Same day |
| Click/LPV gap | LPV/link-click <70% after 50 clicks | Technical owner | 1 business day |
| Lead mismatch | Meta Leads differ from consented first-party Leads by >30% and ≥5 events | Pulse + technical owner | 1 business day |
| Purchase integrity | Any Pixel Purchase without succeeded DB payment | Technical owner | Immediate pause |
| Duplicate Purchase | >5% duplicated event IDs | Technical owner | Immediate investigation |
| Wrong commerce data | Any value/currency/plan mismatch | Technical owner | Immediate pause |
| Policy/access | Rejection, restriction, new admin, billing change, or unknown active asset | Budget owner | Immediate pause/recovery |
| Fatigue | Frequency >3 and CTR down ≥30% | Pulse | Next review; no unapproved edit |

Alerts go to both Pulse and the budget owner. If the normal channel is
unavailable, use the issue thread as the durable incident log. Every incident
entry includes timestamp, affected IDs, spend, screenshots/export, action,
owner, and resolution.

## 11. Approval gates

| Gate | Required explicit approval | Evidence bound to approval |
|---|---|---|
| G0 — Access & measurement QA | Budget owner + technical owner; privacy owner for consent/privacy | Account/roles, 2FA, domain/Pixel ownership, production consent test, Test Events, payment reconciliation, privacy notice |
| G1 — Test envelope | Budget owner | Exact 210–280 ILS amount, 14-day dates, 280 campaign cap, 300 account limit, no billing change |
| G2 — Publish | Budget owner + creative approver | Campaign/ad-set/ad names and IDs, objective/event, audience, placements, all creative/copy, URLs/UTMs, previews, rules |
| G3 — Material change | Budget owner; creative/privacy/technical owner as applicable | Any audience, objective, event, attribution, creative claim, destination, schedule, or rule change |
| G4 — Scale/next test | Budget owner | Final readout, next hypothesis, exact incremental budget, dates, caps, stop rules |
| G5 — CAPI/advanced data use | Technical owner + privacy owner + budget owner | Data map, consent design, terms/notice, security, deduplication QA, rollback |

Approval is version-specific. Silence, prior approval of this plan, account
access, or the presence of a payment method is not launch approval.

## 12. Launch and closeout checklists

### G0 measurement QA

- [ ] Production Pixel ID is explicit, owned by Po Finder, and linked to the
      correct ad account/domain.
- [ ] No Meta request occurs before accepting optional cookies.
- [ ] Decline sends revoke and subsequent navigation sends no Meta events.
- [ ] One initial `PageView` and one per App Router navigation; no duplicate.
- [ ] `CompleteRegistration`, first-draft `Lead`, `InitiateCheckout`, and
      succeeded-payment `Purchase` appear in Meta Test Events with correct data.
- [ ] Failed/pending/foreign-user payments do not produce Purchase.
- [ ] Pixel Purchase `eventID` equals the payment-attempt ID and repeat page
      views do not resend.
- [ ] PostHog receives matching consented funnel events and UTMs.
- [ ] Privacy notice names Meta marketing tracking and cross-border/processor
      implications as approved by the privacy owner.

### G2 pre-publish QA

- [ ] Exact objective, conversion location, event, dates, lifetime budget, and
      account limit match the approval.
- [ ] Only one campaign, one ad set, and three approved ads exist in the test.
- [ ] Current product prices/durations and `pokarov.co.il` are used.
- [ ] Hebrew/RTL, safe zones, rights, claims, links, UTMs, and mobile checkout
      have been checked.
- [ ] Attribution setting, timezone, currency, IDs, rule names, and screenshots
      are logged.
- [ ] Automated rules are tested in preview/notify mode before any pause action.
- [ ] A named budget owner can receive alerts and resume/stop decisions.

### Closeout

- [ ] Campaign is ended/paused and cannot continue spending.
- [ ] Final spend is reconciled to the approved amount.
- [ ] Wait 72 hours for lagged conversions, then freeze the report.
- [ ] Reconcile all reported purchases against the payment database.
- [ ] Record policy, tracking, consent, and access anomalies.
- [ ] Make one decision: stop, revise, or request G4 for a bounded next test.
- [ ] Preserve exports and approval/change history without exporting personal
      user-level data into the issue.

## 13. Risk register

| Risk | Likelihood / impact | Mitigation | Residual owner |
|---|---|---|---|
| Overspend from pacing or configuration | Medium / High | Lifetime budget, account limit, hard pause rules, daily audit | Budget owner |
| Wrong/unapproved asset spends | Low / High | One-campaign allowlist, activity audit, immediate pause | Pulse |
| Pixel sends without valid consent | Low / High | Existing consent gate plus production network QA and immediate stop | Privacy + technical owners |
| Browser undercount from decline/blockers | High / Medium | Report observed data, reconcile DB, do not inflate; consider governed CAPI later | Pulse |
| Duplicate/false Purchase | Low / High | Authenticated succeeded-payment lookup, payment-attempt event ID, reconciliation alert | Technical owner |
| Stale price/domain/feature claims | Medium / High | Live-page verification at G2; versioned creative | Creative approver |
| Small sample produces false winner | High / Medium | Label exploratory, use minimum evidence, sequential hypotheses | Pulse |
| Audience too broad or too narrow | Medium / Medium | One broad baseline, delivery checks, separately funded challenger | Pulse |
| Sensitive or unlawful data use | Low / High | No list uploads/advanced matching/CAPI; privacy gate for expansion | Privacy owner |
| Account compromise or role abuse | Low / High | 2FA, least privilege, two recovery admins, access review | Budget owner |
| Ad rejection/account restriction | Medium / Medium | Policy/landing review; pause rather than evasion | Budget owner |
| Meta/first-party attribution disagreement | High / Medium | Fixed windows, source hierarchy, reconciliation and unattributed bucket | Pulse |
| Broken landing/checkout wastes spend | Medium / High | Preflight and daily synthetic checks; immediate pause | Technical owner |

## 14. Evidence and references

Repository evidence was reviewed at commit `85277d1`, particularly:

- `source/lib/meta-pixel.ts`
- `source/components/providers/MetaPixelProvider.tsx`
- `source/app/dashboard/profile/page.tsx`
- `source/app/dashboard/billing/BillingClient.tsx`
- `source/app/dashboard/billing/page.tsx`
- `source/components/layout/CookieConsent.tsx`
- `source/lib/posthog.ts`

Primary external references:

- [Meta Traffic objective](https://www.facebook.com/business/ads/ad-objectives/traffic)
- [Meta Sales objective](https://www.facebook.com/business/ads/ad-objectives/sales)
- [Meta ad budgets and schedules](https://www.facebook.com/business/ads/pricing)
- [Meta Advantage+ placements](https://www.facebook.com/business/ads/meta-advantage-plus/placements)
- [Meta ad review and policy process](https://www.facebook.com/business/ads/review-policy-guidelines)
- [Meta Ads Manager activity history](https://www.facebook.com/help/289211751238030)
- [Israel Privacy Protection Authority — Amendment 13 Q&A](https://www.gov.il/he/pages/tikun13_qa)
- [Israel Privacy Protection Authority — Data Security Regulations Q&A](https://www.gov.il/he/pages/data_security_fqa)

Meta interface labels and available attribution settings can vary by account and
change over time. G0/G2 must capture the actual settings visible in the account
at approval time.
