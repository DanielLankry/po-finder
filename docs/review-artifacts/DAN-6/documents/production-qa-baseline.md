# DAN-6 — Independent production and QA baseline

**Tested:** 2026-07-28 19:33–19:52 UTC  
**Reviewer:** Sentinel (independent QA)  
**Deployment verdict:** **CHANGES REQUIRED**  
**Task verdict:** Baseline and required regression gate established; current production does not meet the basic-accessibility acceptance criterion.

## Target and build identity

- Canonical production URL: `https://pokarov.co.il/`
- Vercel project: `po-finder` (`prj_HEx8NLwsMLXjO9BMgYsiUXyQod8i`), Next.js, Node 24.x
- Production deployment: `dpl_CGM4vdBhnzL8JC3rkHNQCkRCAakB`
- Immutable URL: `https://po-finder-n70xmwxum-daniellankrys-projects.vercel.app`
- Git ref/commit: `master` / `85277d15a761c0af336a9ff7074b237af25e7cc9`
- Deployment created: `2026-07-28T14:07:17Z`; READY: `2026-07-28T14:08:38Z`; region `iad1`
- Edge response observed through Cloudflare/Vercel: home HTTP 200, HTTP→HTTPS 308, `www`→apex 307, HSTS `max-age=63072000`, cache hit observed.
- Public-data baseline: `GET /api/businesses?includeSchedule=1` returned HTTP 200 with `{"businesses":[]}`. This constrains live consumer-journey coverage as noted below.

## Independent run log

Browser: Playwright Chromium 1.58, locale `he-IL`, RTL, desktop 1440×900 and mobile/touch 390×844.

| Area | Evidence | Result |
|---|---|---|
| Home load | HTTP 200; title, Hebrew/RTL metadata, Google map, search/filter controls rendered; no page exceptions or failed requests | PASS |
| Desktop responsiveness | 1440×900, no document-level horizontal overflow | PASS |
| Mobile responsiveness | 390×844, menu/search/map-list toggles render; no document-level horizontal overflow | PASS with accessibility finding below |
| Location | “תל אביב” produced a five-item combobox list; denied geolocation produced visible “הגישה למיקום נחסמה” feedback | PASS |
| Search/categories/filter | Search accepted “קפה”; category exposed `aria-pressed=true`; advanced filter dialog rendered | PASS for control behavior; result relevance untestable with zero businesses |
| Routes | `/about`, `/contact`, `/vendors`, `/pricing`, `/auth/login`, `/privacy`, `/terms` all returned HTTP 200 without page exceptions/failed requests | PASS |
| Vendor funnel boundary | Six-month pricing CTA redirected to `/auth/register?redirectTo=%2Fdashboard%2Fbilling%3Fplan%3Dlisting_6m`; registration page preserved intent | PASS |
| Authentication boundary | Login page loaded; Google OAuth initiation reached the Google account chooser. No account was created and no credentials were entered | PASS to provider boundary |
| Contact validation | Empty form keeps submit disabled; invalid email fails native validity; synthetic valid state enables submit. No contact submission was sent | PASS |
| 404 behavior | Unknown route returned real HTTP 404 with Hebrew explanation, home link, and contact link | PASS |
| Business API failure | Browser-intercepted 503 showed a Hebrew `role=alert` plus “נסו שוב”; retry received real HTTP 200 and restored the empty state | PASS |
| Consent | Named cookie-consent dialog accepts/rejects; consent state persists in local storage | PASS |
| Vercel health | Current production deployment READY; error-only build log showed one edge-runtime warning and successful completion; no grouped runtime errors in prior 7 days | PASS |
| Runtime status sample | Vercel seven-day grouped logs: 550×200, 2×404, 1×401 among the displayed status groups | INFORMATIONAL |
| WCAG automation | axe-core 4.10.3, WCAG 2 A/AA + 2.1 A/AA on home desktop/mobile, pricing, contact, login | FAIL |
| Frame policy | `/auth/login` successfully loaded in a cross-origin iframe; tested response headers have HSTS but no CSP/frame-ancestors or X-Frame-Options | FAIL |

## Findings, ordered by severity

### HIGH — Mobile search modal does not manage or contain keyboard focus

Route: `https://pokarov.co.il/`, viewport 390×844. The control named “פתיחת חיפוש” opens a `role="dialog" aria-modal="true"`, but focus remains on the opener. Repeated Tab then visits background “מועדפים” and “פתיחת תפריט” before entering the dialog; after the dialog input/location/cancel controls, focus proceeds to the obscured underlying page location input and button. The opener also has no `aria-expanded`, `aria-haspopup`, or `aria-controls`.

Reproduction:

1. Open `/` at 390×844 and dismiss consent.
2. Activate “פתיחת חיפוש” using keyboard.
3. Observe focus remains on the opener.
4. Press Tab: focus sequence includes background header controls, then dialog controls, then underlying page controls.

Impact: keyboard and screen-reader users can operate obscured controls and lose context. The modal does not satisfy expected modal focus behavior or a logical focus order.

### HIGH — Contact subject group uses invalid ARIA

Route/selector: `https://pokarov.co.il/contact`, `div[aria-required="true"]`.

axe-core 4.10.3 reports `aria-allowed-attr` with **critical** impact: `aria-required` is applied to a generic `div`, where that attribute is not allowed. Native validation exists on the radio controls, but the group’s required semantics are invalid for assistive technology.

### MEDIUM — Serious color-contrast failures span critical routes

axe-core reports WCAG contrast violations on every tested critical surface:

- Contact WhatsApp CTA: white on `#25D366`, **1.98:1** (requires 4.5:1).
- Contact response-time text: `#AAAAAA` on white, **2.32:1**.
- Login terms/privacy sentence: `#9CA3AF` on white, **2.53:1**.
- Pricing duration helper: **4.1:1**.
- Home/pricing/login orange brand controls: **4.48:1**, narrowly below 4.5:1.
- Contact footer links: **4.29:1**; privacy link in a text block is not distinguishable without color.

These are automated serious-impact findings and block a basic WCAG-AA accessibility gate.

### MEDIUM — Authentication and pricing pages are frameable

The tested responses for `/`, `/auth/login`, `/pricing`, and `/contact` provide HSTS but no `Content-Security-Policy`/`frame-ancestors` or `X-Frame-Options`. A cross-origin test document successfully embedded `https://pokarov.co.il/auth/login` in an iframe with no browser refusal or console error.

Impact: UI-redress/clickjacking risk around login, registration, and purchase-intent flows. Add an explicit frame policy, preferably CSP `frame-ancestors 'none'` (or a deliberately documented allowlist), and regression-test it.

### LOW — Landmark coverage is inconsistent

The home route and `/vendors` expose header/navigation but no semantic `<main>`/`role="main"` landmark in the tested DOM. The home skip link targets a generic `div#main-content`. Other marketing/legal routes do expose `<main>`, so navigation semantics are inconsistent.

## Required regression suite before development is accepted

1. **Build identity and deployment health**
   - Record exact commit, preview URL, deployment ID, build status, and runtime-error scan.
   - Gate promotion on READY plus zero new fatal/error clusters; production promotion remains an approval-gated action.

2. **Consumer discovery journey**
   - Seed deterministic business fixtures in a non-production environment.
   - Verify map/list parity, visible markers, business card/detail, search relevance, category/filter combinations, location autocomplete, granted/denied geolocation, favorites, phone/contact affordances, and empty state.
   - Assert `/api/businesses` schema and schedule behavior, not only HTTP status.

3. **Vendor funnel**
   - Verify every pricing duration and displayed amount/date.
   - Assert plan intent survives pricing → register/login → billing.
   - Exercise registration/login validation, OAuth callback allowlisting, authenticated dashboard, draft creation, image/location/hours validation, and cancellation/renewal visibility with test accounts.
   - Payment tests must use a sandbox/test environment; no real charge or paid-service creation without Daniel approval.

4. **Contact and failure behavior**
   - Test contact form empty/invalid/success/server-failure states against a mocked/test endpoint.
   - Test 404, business API 401/403/429/500/timeout, retry recovery, offline state, geolocation denial, and OAuth cancellation.

5. **Responsive/browser matrix**
   - Chromium, Firefox, and WebKit at minimum 390×844, 768×1024, and 1440×900.
   - Assert no page overflow, obscured primary controls, clipped content, or modal/background focus escape.

6. **Accessibility release gate**
   - axe on home, map/list, business detail, pricing, contact, register/login, and dashboard: zero critical/serious violations.
   - Keyboard-only journeys including skip link, mobile menu/search/filter dialogs, focus entry/trap/restore, Escape close, visible focus, and logical tab order.
   - Accessible names/states, valid ARIA, one main landmark, heading order, touch targets, and WCAG-AA contrast.

7. **Security-minded baseline**
   - Assert CSP including `frame-ancestors`, `X-Content-Type-Options`, Referrer-Policy, Permissions-Policy as appropriate, HSTS, secure auth/session cookie attributes, redirect allowlists, and no secrets/PII in client logs.

## Untested / residual risk

- The production API returned zero businesses, so live business-marker/card/detail/review/contact relevance could not be proven.
- No user credentials were supplied; full authenticated dashboard/business-management flows were not exercised.
- No contact request, account creation, database write, payment, deployment, migration, or secret change was performed.
- Firefox/WebKit binaries were unavailable in this run; those engines remain untested.
- The managed checkout contains no repository files or Git metadata, so source diff, code-line attribution, unit tests, and local build verification were not possible for this production-baseline issue.
