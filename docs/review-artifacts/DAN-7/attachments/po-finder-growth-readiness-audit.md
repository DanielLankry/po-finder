# Po Finder positioning and growth-readiness audit

**Issue:** DAN-7  
**Product:** [pokarov.co.il](https://pokarov.co.il) / “פה קרוב”  
**Audit date:** 28 July 2026  
**Scope:** Public consumer discovery journey, merchant acquisition surface, discoverability, trust, and accessible measurement evidence. No campaigns were launched and no spend was incurred.

## Executive verdict

**Po Finder has a credible product concept and a working merchant purchase path, but it is not ready for paid growth.**

The differentiated idea is useful: help people find mobile and very small local businesses by **current location, current hours, and category**, without installing an app. The current product, however, is an empty two-sided marketplace: the production businesses endpoint returned `{"businesses":[]}`, and the consumer homepage therefore converts into a merchant recruitment screen instead of completing a discovery task ([live API](https://pokarov.co.il/api/businesses), [homepage](https://pokarov.co.il)).

The immediate growth job is not “get more traffic.” It is:

1. Establish a dense, trustworthy founding supply in one geographic/category wedge.
2. Instrument successful discovery and merchant activation end to end.
3. Fix first-party discoverability and page-level metadata.
4. Prove that a listing produces qualified consumer actions before asking merchants to pay.

At the current observed volume—**84 consented pageviews from 6 unique visitors over the last 30 days**—A/B testing would create noise, not learning. Sequential concierge tests and qualitative interviews are the right no-spend methods.

## Recommended positioning

### Positioning statement

> For people who want a good small business that is actually nearby and open now, פה קרוב shows verified mobile vendors, stalls, pop-ups, and neighborhood makers by their current location and hours. Unlike broad local directories, it is built around businesses whose place and availability can change.

### Focus the launch wedge

Do not lead with the current broad promise of “all small businesses.” Start with **mobile, time-sensitive supply**—coffee carts, street-food stalls, pop-ups, fairs, and market vendors—because dynamic location and live availability are meaningful differentiators there.

“Small local businesses” can remain the long-term market, but it weakens the launch proposition: fixed businesses already receive free, trusted discovery through Google Maps and mature Israeli directories.

### Likely audience segments

| Segment | Job to be done | Evidence and implication |
|---|---|---|
| **Spontaneous nearby seekers** | “Show me something good that is open near me now.” | The product already emphasizes location, categories, and “open now.” This should be the primary consumer job. |
| **Destination planners** | “Find a coffee cart, food stop, market, or maker worth a short trip.” | Category, hours, reviews, kashrut, photos, and directions are relevant; current competitors already set a high content-density expectation. |
| **Mobile vendors and stalls** | “Help customers find where I am operating today.” | Strongest product/market fit because location and schedule can change. |
| **Short-lived sellers** | “Make this weekend’s pop-up or fair discoverable without a subscription.” | The one-day to 12-month duration model fits, but value needs proof before payment. |
| **Home-based and micro-businesses** | “Give me a simple profile and direct contact channel.” | Secondary segment; the benefit is less differentiated from free listings elsewhere. |

## Captured flow and health

### Step 1 — Consumer enters the map/list experience: **At risk**

![Desktop homepage empty-state capture](screenshots/01-home-desktop.png)

The map-first concept is immediately understandable, and the search, category chips, filters, favorites, and map/list control expose useful discovery affordances. The production API and accepted capture show no live businesses, so the promise cannot currently be fulfilled.

The empty state says “be the first business” and sends the visitor to pricing. This is sensible for supply recruitment, but it means a consumer arrival becomes a merchant conversion attempt. The homepage should instead state the launch area, let consumers request a place/category, and set an honest expectation about availability.

### Step 2 — Consumer searches or shares location: **Structurally sound, outcome unverified**

![Narrow-viewport homepage capture](screenshots/02-home-mobile.png)

The public code supports:

- typed place search restricted to Israel;
- an explicit GPS action rather than an unsolicited permission prompt;
- category, kashrut, rating, and “open now” filters;
- mobile list/map switching;
- retry and empty-result states.

The narrow viewport preserves the core actions, but the header/category density is high. A real-device usability pass should test discoverability of horizontal category scrolling, the difference between location search and business search, and whether map/list switching remains obvious.

### Step 3 — Consumer reviews results: **Blocked**

The production response was empty, so no list card, map marker, ranking, distance sort, or “open now” result could be exercised. This is the primary audit blocker and the primary business blocker.

The source separates a true platform-empty state from a zero-result filter state, which is a good implementation detail ([BusinessListPanel source](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/components/business/BusinessListPanel.tsx)).

### Step 4 — Consumer evaluates and contacts a business: **Blocked, but well designed in code**

No public business detail page exists to inspect because there are no public listings. The implemented detail surface includes:

- verified badge;
- availability and hours;
- photo gallery;
- reviews;
- WhatsApp, call, and directions actions;
- events;
- `LocalBusiness` structured data and canonical URLs.

That is the right trust/action set. It still needs a first live listing to validate copy, signed photo URLs, mobile sticky actions, freshness, and actual outbound tracking ([business page source](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/app/businesses/%5Bid%5D/page.tsx)).

### Step 5 — Merchant understands the offer: **Clear but unproven**

![Merchant landing-page capture](screenshots/03-vendors-desktop.png)

The merchant page clearly explains:

- free draft before payment;
- verification;
- one-time payment;
- no subscription, commission, promotion tier, or recurring charge;
- durations from one day to 12 months;
- profile, photos, location, hours, reviews, contact, and basic statistics.

This is strong transactional clarity. The missing proof is more important than the copy: there is no live example, audience density, traffic baseline, testimonial, case study, or expected contact outcome. “Customers see you in real time” is currently an aspiration.

### Step 6 — Merchant chooses duration and pays: **Operationally clear, strategically premature**

![Pricing-page capture](screenshots/04-pricing-desktop.png)

The live pricing page preselects six months at ₪160 and describes a one-time payment. The duration slider and expiry date are understandable, and the legal policies are linked. However, asking a founding merchant to buy six months of exposure in a marketplace with zero consumer inventory and six observed consented visitors is a trust mismatch.

Use a free, manually approved founding cohort until Po Finder can report a credible number of qualified views, directions, calls, or WhatsApp clicks per listing.

## What is already strong

- **Distinct visual identity:** warm paper, green ink, and terracotta accents feel local and memorable.
- **Clear merchant terms:** free draft, one-time payment, no auto-renewal, and no sales commission reduce billing anxiety.
- **Legitimate operator disclosure:** the legal pages expose business name/ID, address, email, phone/WhatsApp, domain, privacy, refund, terms, and accessibility information.
- **Privacy-aware analytics:** PostHog, Vercel Analytics, Meta Pixel, and business-level events are gated behind explicit cookie consent.
- **Useful implementation foundations:** proper error/empty states, verified/public listing rules, scheduled location/hours, reviews, direct-contact actions, business structured data, and an Israel-specific schedule resolver.
- **Basic technical discoverability:** index/follow directives, Search Console verification, a sitemap, homepage structured data, per-business metadata, and crawlable Hebrew homepage copy exist.

## Trust gaps

Prioritized from highest to lowest impact:

1. **No supply and no completed consumer outcome.** The product cannot yet demonstrate its core promise.
2. **“Real-time” has no visible freshness contract.** Users need “updated X minutes/hours ago,” an explanation of who verifies status, and a way to report a wrong location or closure.
3. **Merchant value is unsupported.** No live profile example, traffic proof, contact proof, testimonial, or founding-customer story appears before payment.
4. **The verification badge is unexplained.** State what was verified: identity, ownership, phone, location, hours, or merely moderation approval.
5. **Broad category promise dilutes credibility.** “Coffee carts and moving vendors” is believable; “all small businesses throughout Israel” is not yet supported by supply.
6. **The cookie dialog covers core content and CTAs in the accepted captures.** It is legally useful, but its visual prominence competes with the primary task.

## Discoverability audit

### Confirmed strengths

- Homepage title, Hebrew description, Open Graph image, `Organization`/`WebSite` JSON-LD, canonical, robots directives, and Search Console verification are present ([layout source](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/app/layout.tsx)).
- Business pages have unique titles/descriptions, canonical URLs, Open Graph data, and `LocalBusiness` JSON-LD.
- The sitemap can include verified active business pages dynamically.

### Confirmed issues

1. **Merchant pages canonicalize to the homepage.** Live `/vendors` and `/pricing` HTML both emit `https://pokarov.co.il` as canonical and inherit homepage Open Graph title/description/URL. This tells search/social systems that those pages are duplicates.
2. **The sitemap contains only the homepage and `/about` while inventory is empty.** `/vendors`, `/pricing`, category pages, location pages, legal pages, and other useful acquisition surfaces are absent ([live sitemap](https://pokarov.co.il/sitemap.xml), [sitemap source](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/app/sitemap.ts)).
3. **There are no indexable category/location landing pages.** Homepage search and filters are client-side state, so Po Finder has no crawlable answer for queries such as “coffee carts near Haifa.”
4. **The accessible web search performed for this audit did not surface a first-party Po Finder result for `site:pokarov.co.il`; it surfaced a third-party site check.** Treat this as a warning, not a definitive Google Search Console diagnosis.
5. **The current SEO copy names many cities without inventory.** Create location pages only where there is verified density; thin empty pages would harm trust.

### Comparator context

Easy’s coffee-cart result surface shows the baseline consumers already receive: open now, reviews, price, kashrut, accessibility, seating, food preferences, payment methods, and many other filters ([Easy coffee carts](https://easy.co.il/list/Coffee-Carts), [example regional results](https://easy.co.il/list/Coffee-Carts?region=186)).

Google Business Profile is free and already places eligible businesses in Search and Maps with location, phone, website, hours, photos, reviews, and owner updates ([Google Business Profile overview](https://support.google.com/business/answer/7039811?hl=en-en), [profile fields](https://support.google.com/business/answer/16394780?hl=en)). Google also reports views, searches, directions, calls, and website clicks to verified owners ([performance metrics](https://support.google.com/business/answer/9918094?hl=en)).

Therefore Po Finder should not position itself as “another business profile.” It should win on **live operational location, time-sensitive availability, temporary appearances, and a focused community of mobile vendors**.

## Analytics and measurement readiness

### Accessible evidence

The deployed bundle contains a PostHog public key/host, Meta Pixel ID, and Vercel Analytics code. Source inspection confirms consent-aware initialization and pageview capture ([PostHog provider](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/components/providers/PostHogProvider.tsx), [Meta provider](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/components/providers/MetaPixelProvider.tsx)).

Connected PostHog evidence for 28 June–28 July 2026:

| Metric | Observed |
|---|---:|
| Consented pageviews | 84 |
| Unique visitors | 6 |
| Homepage pageviews | 40 |
| Pricing pageviews | 12 |
| Merchant landing-page views | 7 |
| Pageviews with `utm_source=fb` | 2 |
| Pageviews without `utm_source` | 82 |
| Product-specific custom events observed in schema | 0 |
| Saved dashboards | 1 generic starter dashboard |
| Saved insights | 6 generic starter insights |

The project source defines merchant events—`registration_completed`, `business_draft_created`, `checkout_started`, and `listing_purchased`—but none appear in the observed event taxonomy. That can mean no conversion has occurred, not necessarily broken instrumentation. Either way, an end-to-end funnel cannot currently be read.

Business detail views and call/WhatsApp/directions clicks are written to a separate server-side table after consent, with validation and rate limiting ([analytics source](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/lib/analytics.ts), [event API](https://github.com/DanielLankry/po-finder/blob/85277d15a761c0af336a9ff7074b237af25e7cc9/app/api/analytics/events/route.ts)). This is useful for merchant reporting, but it does not cover the full consumer or acquisition journey.

### Readiness rating: **2/5 — installed, not decision-ready**

What is missing:

- consumer events: location search, GPS success/denial, category/filter use, result count, list/map toggle, card open, favorite, share, zero-result, area request;
- a unified consumer outcome event: directions/call/WhatsApp from either map, inline detail, or business page;
- merchant funnel coverage and QA through registration → draft → verification → checkout → paid activation;
- source/medium/campaign conventions for every shared link and outreach motion;
- operator/test-traffic exclusion;
- a launch dashboard with agreed KPIs, definitions, and alerts;
- supply-health metrics such as active listings, last location update, hours completeness, photo coverage, and stale listings.

### Measurement model to implement before growth

**North-star metric:** weekly successful discovery sessions—sessions in which a consumer opens a verified business and completes a directions, call, or WhatsApp action.

**Supply guardrails:**

- active verified listings in the launch area;
- percentage with current location/hours updated in the last 7 days;
- percentage with phone/WhatsApp, one real photo, category, and complete schedule;
- stale/wrong-location reports and time to correction.

**Merchant funnel:**

`vendors/pricing view → registration started → registration completed → draft created → verification completed → listing activated → first qualified consumer action → renewal`

At the current volume, report counts and exact sessions; do not optimize percentages until denominators are large enough.

## Prioritized opportunity brief

| Priority | Opportunity / required product change | Why now | Success signal |
|---|---|---|---|
| **P0** | **Launch a free founding cohort in one wedge**: one city/region plus coffee carts, street food, and pop-ups; manually onboard 10–20 businesses with owner consent. | Inventory is zero; demand acquisition cannot work without usable results. | ≥10 verified live listings, ≥80% with fresh hours/location and complete contact/photo data. |
| **P0** | **Replace empty-home merchant takeover with an honest launch state**: name the launch area, show planned categories, add “request this area/category,” and keep a secondary merchant CTA. | Current consumer arrivals cannot complete their job and are redirected to pricing. | ≥20 qualified area/category requests; no consumer expects live national coverage. |
| **P0** | **Ship the minimum event taxonomy and launch dashboard** described above; exclude operator/test traffic; verify every merchant and consumer event once in production. | There is pageview data but no decision-ready funnel. | Every step emits a QA event; one dashboard shows demand, supply, merchant funnel, attribution, and freshness. |
| **P0** | **Add a freshness contract**: “updated X ago,” verification explanation, report-wrong-location/closed control, and stale-listing suppression. | “Real time” is the core promise and the largest trust risk. | 90% of live listings fresh within 7 days; wrong-location reports resolved within 24 hours. |
| **P0** | **Pause paid-listing emphasis for founders**: grant free launch credit or waive payment until a listing receives a minimum proof threshold. | Charging before supply/demand proof creates adverse selection and trust loss. | ≥5 founders receive a qualified action; collect three attributable outcome stories. |
| **P1** | **Fix page-level canonical/Open Graph metadata and sitemap coverage.** Add `/vendors` and `/pricing`; include inventory-backed location/category pages only after density exists. | Current merchant pages declare the homepage as canonical and are absent from the sitemap. | Correct self-canonicals; Search Console indexing for launch pages; no empty thin pages. |
| **P1** | **Show proof before price**: live example profile, what “verified” means, freshness badge, real traffic/contact counts, and founding-business testimonials. | Merchant proposition is clear but unsupported. | Merchant interview comprehension improves; draft-start rate rises sequentially. |
| **P1** | **Tighten positioning to mobile/time-sensitive businesses.** Update hero and SEO copy around “where they are today” and “open now.” | This is the defensible difference from Google/Easy. | 8/10 target merchants and consumers can repeat the differentiator unaided. |
| **P2** | **Create owner-powered distribution**: shareable listing link with UTM, downloadable QR, WhatsApp share template, and “confirm today’s location” prompt. | Owner channels can seed demand at no media cost. | ≥30% of listing visits come through attributed owner shares; measure qualified action rate. |

## No-spend experiments

### 1. Founding-supply concierge test — run first

- Recruit 15 target vendors manually from one geographic cluster.
- Offer free onboarding and listing for the test period; do not promise traffic.
- Complete profiles together and require today/this-week location confirmation.
- Interview every owner on current discovery channels, frequency of location change, and the action they value most.
- **Pass:** 10 live complete listings, 8 remain fresh after two weeks, and at least 5 receive a qualified consumer action.

### 2. Consumer concierge discovery test — run once 10 listings are live

- Share one inventory-backed landing link in relevant existing community groups and through participating owners; use distinct UTMs.
- Ask consumers to find an open cart/vendor and record whether they choose directions, call, or WhatsApp.
- Follow up with 10 users: Was the location accurate? What proof was missing? Would they return?
- **Pass:** 30 qualified discovery sessions, ≥30% open a business, ≥15% complete an outbound action, and no unresolved wrong-location report.

### 3. Merchant positioning test — sequential, not A/B

Test two propositions in 8–10 interviews each:

- A: “Appear on a map for a one-time fee.”
- B: “Let customers find where you are operating today—location, hours, and direct contact in one link.”

Show the same founding offer and ask for a concrete next step (create draft or schedule onboarding), not preference.

- **Pass:** B produces materially more draft starts and clearer unaided recall. If not, the differentiator needs revision.

### 4. Indexability repair test

- Fix self-canonicals and Open Graph metadata for `/vendors` and `/pricing`.
- Add those two pages to the sitemap.
- After live inventory exists, publish only one strong category/location page with real listings, unique copy, and self-canonical.
- **Pass:** pages are indexed, receive Search Console impressions, and bring non-branded queries without creating empty search experiences.

### 5. Owner-powered referral test

- Give each founding business a tagged listing link, QR, and ready-to-send WhatsApp message.
- Compare visits and successful discovery actions per owner share source.
- **Pass:** at least five businesses drive attributable visits and two drive qualified consumer actions; use the best story as proof on the merchant page.

## Recommended 30-day sequence

### Days 1–7: readiness

- Fix canonical/OG/sitemap defects.
- Add minimum consumer + merchant event taxonomy and launch dashboard.
- Add freshness, verification, and wrong-location reporting.
- Replace the national empty-state promise with a named launch wedge and area-request capture.

### Days 8–21: concierge supply

- Recruit and manually onboard the founding cohort.
- Keep founder listings free.
- Verify every listing and update cadence.
- Collect owner interviews and publish one live example profile.

### Days 22–30: demand learning

- Run the consumer concierge test through owner/community channels.
- Review exact sessions and qualified outcomes.
- Publish the first outcome story only if attributable.
- Decide whether to expand the same wedge, change positioning, or stop—do not widen geography based on pageviews alone.

## Accessibility observations and limits

Visible/source-confirmed strengths include a skip link, Hebrew RTL document direction, accessible labels on search/GPS/favorites/map toggles, 44px mobile controls, focus-visible styling, listbox semantics, error alerts, and reduced-motion consideration.

Risks requiring direct testing:

- keyboard navigation through map markers, search predictions, filters, cookie preferences, and dialogs;
- screen-reader announcement of result-count and map/list state changes;
- contrast in low-opacity secondary text and disabled/skeleton states;
- 200% zoom/reflow and narrow-device header/category density;
- focus trapping and restoration in cookie, navigation, favorites, and filter overlays.

This is not a WCAG compliance claim.

## Evidence limits

- The configured `agent-browser` capture CLI was unavailable in this environment. Screenshots were captured through a public page renderer, saved, and visually inspected; dynamic clicks and permission flows were not executed.
- No consumer result/detail step could be completed because the production businesses API returned an empty array.
- PostHog evidence is consented traffic only and likely includes operator/internal visits; no reliable test-account filter is configured.
- Vercel Analytics, Meta Events Manager, Google Search Console performance, payment dashboards, and private database tables were not inspected.
- Search-result sampling is directional; Search Console is the source of truth for indexing and query impressions.

## Decision

**Growth readiness: red for paid acquisition, amber for a focused no-spend founding launch.**

Proceed only with a single-wedge supply-and-learning launch. Reassess broader acquisition after Po Finder has:

1. at least 10 fresh verified listings in one area;
2. a verified end-to-end event taxonomy;
3. at least 30 qualified consumer discovery sessions;
4. attributable outbound actions for multiple businesses; and
5. one honest merchant proof story.

