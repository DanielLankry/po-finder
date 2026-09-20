# DAN-79 — Weekly SEO and competitor scan

**Query date:** 2026-08-02 UTC  
**Owner:** Scout  
**Audience:** Atlas  
**Scope:** Read-only production, repository, competitor, and public search research. No site changes, publishing, campaigns, account registrations, or paid services.

## Decision summary

The immediate constraint is not a missing keyword list. Production has **zero public businesses**, its XML sitemap exposes only **two URLs**, and several distinct public pages currently declare the homepage as canonical. Competitors already have hundreds of listing and intent pages.

Recommended sequence:

1. **Close the production discovery gap first:** release the already-present sitemap and self-canonical work only after normal review/approval, then verify the live output. Also give `/vendors` and `/pricing` distinct titles and descriptions.
2. **Acquire a narrow inventory wedge:** prioritize verified coffee carts and food trucks in one region before broad “small business” acquisition. Search evidence is much more concrete for `עגלת קפה`, `פוד טראק`, proximity, weekend, city, and amenity intents than for generic `עסקים קטנים`.
3. **Create only a few useful landing pages from real inventory:** begin with location + category and high-value filters after enough listings exist. Do not generate empty or thin programmatic pages.
4. **Measure with first-party search data:** obtain a Search Console export before claiming keyword growth or week-over-week movement. This first scan is a baseline, not a measured trend report.

## Objective and constraints

Objective: identify current search demand signals, competitor advantages, content and technical gaps, low-cost maintained tools, and the smallest testable actions that can improve local discoverability.

Constraints:

- No Google Search Console, Google Ads Keyword Planner, Google Business Profile, or Bing Webmaster account data was available to Scout.
- Google autocomplete is directional and personalized; it does **not** provide search volume.
- There is no prior DAN-79 scan, so competitor changes cannot yet be proven week over week.
- Search result sampling varies by location and personalization. Observed visibility is evidence of opportunity, not a rank guarantee.
- No paid product, owner profile, deployment, or publication is authorized by this issue.

## Sourced facts

### Production and checked-out source

| Finding | Evidence | Confidence | Expected impact |
|---|---|---:|---:|
| Production currently exposes no public inventory. | [`GET /api/businesses`](https://pokarov.co.il/api/businesses) returned `businesses: []` on the query date. | High | Critical: there are no listing pages to discover, rank, or satisfy local intent. |
| The live sitemap contains only the homepage and `/about`. | [`/sitemap.xml`](https://pokarov.co.il/sitemap.xml) returned two `<loc>` entries. | High | High: important public pages are not being declared through this discovery surface. |
| The live sitemap reports a fresh current timestamp for unchanged static entries. | Both entries carried `2026-08-02T10:01:54.565Z` during the check. Google says `lastmod` should reflect the last significant page update and be consistently accurate. [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) | High | Medium: inaccurate timestamps can make `lastmod` untrustworthy as a crawl-scheduling signal. |
| Distinct live pages currently canonicalize to the homepage. | `/about`, `/contact`, `/vendors`, `/pricing`, and `/terms` all returned `<link rel="canonical" href="https://pokarov.co.il">` during direct checks. Google describes `rel="canonical"` as a strong canonicalization signal. [Google canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) | High | Critical: Google may consolidate signals away from useful acquisition and trust pages. |
| The checked-out source is ahead of production for both issues. | `source/app/sitemap.ts` declares nine static URLs plus eligible business URLs; page-level metadata in the checked-out tree declares self-canonicals for `/about`, `/contact`, `/vendors`, `/pricing`, legal pages, and business pages. | High | High: this appears to be a release/revision gap, not a need to redesign sitemap logic from scratch. |
| `/vendors` and `/pricing` have duplicate search snippets even in the checked-out source. | Both currently use the title `הצטרפות עסקים` and the same description. | High | Medium: the two pages target different owner jobs but give searchers no distinction. |
| Technical foundations exist in the checked-out source. | Root metadata includes the Search Console verification token; business pages implement per-page metadata and `LocalBusiness` JSON-LD; `robots.ts` permits public crawling and disallows private/app surfaces. | High | Positive baseline; these should be verified live after release rather than rebuilt. |
| Homepage SEO copy is screen-reader-only. | `source/app/page.tsx` puts the category/city copy in an `sr-only` section. Google recommends expressing important visual content in useful text on the page. [Google developer SEO guide](https://developers.google.com/search/docs/fundamentals/get-started-developers) | High fact / Medium implication | Medium: a compact visible explanation and real inventory summary would be more useful to people and search engines. |

### Search and demand signals

Google autocomplete sampled on 2026-08-02 returned these recurring intent patterns:

- `עגלת קפה`: `פתוחה בשבת` plus named cities and places.
- `קפה קרוב אליי`: `פתוח עכשיו`, `בטווח של 400 מ`, `בטווח של 800 מ`, `כשר`, and `עגלת קפה קרוב אליי`.
- `עגלת קפה ליד`: sea, Jerusalem, Modi'in, Kinneret, Rehovot, Ashkelon, and Ashdod variants.
- `פוד טראק`: a mix of named locations and purchase-oriented terms.
- `עסקים קטנים`: mostly broad business, sale, and regional terms, not a clear consumer discovery job.

**Interpretation:** category + location + “open now/weekend” has clearer consumer intent than the broad head term `עסקים קטנים`. Confidence is medium because autocomplete is not volume data.

Current publishing also supports the coffee-cart/weekend wedge:

- Israel Hayom published a current roundup of [five coffee carts open on Saturday](https://www.israelhayom.co.il/food/food-news/article/21045783) in the week before this scan.
- Mako recently combined the same intent with a safety attribute: [recommended coffee carts open on Saturday with a nearby protected space](https://www.mako.co.il/travel-israel/Article-958dcceb8503d91027.htm).
- Mako's 2026 reader roundup says the category has grown to [more than 350 carts](https://www.mako.co.il/travel-israel/Article-6aa78c2e79dcc91027.htm?Partner=mw). Treat this as editorial reporting, not an independently audited market count.

### Competitor baseline

| Competitor | Current discoverability pattern | Scale observed on 2026-08-02 | Implication for Po Finder |
|---|---|---:|---|
| [CoffeeTrail](https://coffeetrail.co.il/) | Listing pages, editorial posts, regions, roads, and filters for open now/Saturday, kosher, playground, protected space, reservist-owned, charging, routes, and events. Fresh 2026 pages target sea, trips, Saturday, and kosher intent. | Sitemap index exposed 394 listing URLs, 99 posts, 33 regions, 25 roads, plus taxonomy pages: about 900 entries in total. | Strongest specialist benchmark. It wins through inventory plus many useful ways to slice that inventory. |
| [CoffeeFinder](https://coffeefinder.co.il/) | Coffee cart/cafe discovery by city with ratings, hours, photos, and navigation. | [`sitemap.xml`](https://coffeefinder.co.il/sitemap.xml) exposed 842 URLs. | A leaner but still inventory-rich specialist; confirms city pages and enriched listing data are table stakes. |
| [Easy](https://easy.co.il/list/Coffee-Carts) | Broad local index with open-now/Saturday/night, accessibility, delivery, payment, family, protected-space, and other facets; dynamic regional pages contain counts and reviews. | One sampled Haifa/Carmel filtered page exposed 63 results; national scale not measured. | Competing on every facet is unrealistic. Po Finder needs a narrower, more current mobile-business value proposition. |
| [B144](https://www.b144.co.il/%D7%A2%D7%92%D7%9C%D7%AA-%D7%A7%D7%A4%D7%94/) | Category and city pages with long descriptions, current hours, related categories, and internal links. | National page plus sampled city links; total not measured. | Shows the value of crawlable city/category navigation, though result quality is less specialized. |
| [Haagala](https://haagala.com/) | Simple location-first map with Saturday, parking, kosher, playground, recommended, and user-submitted listing flows. | Scale not exposed in a sitemap. | The closest lightweight product analogue: map utility plus a small set of understandable filters. |

No prior snapshot exists, so the table records **current competitor signals**, not verified weekly changes. Future scans should diff sitemap counts, last modification dates, navigation labels, and newly published pages.

## Options and tradeoffs

### Option A — Technical correction only

Release and verify the checked-out sitemap/self-canonical work; differentiate `/vendors` and `/pricing` metadata.

- Advantages: small, necessary, low conceptual risk.
- Limits: zero inventory means technical cleanliness alone cannot earn useful local discovery traffic.
- Recommendation: do this, but do not mistake it for the growth strategy.

### Option B — Generate city/filter content immediately

Create many indexable pages for cities, categories, weekend, kosher, accessibility, and proximity.

- Advantages: mimics competitor search coverage quickly.
- Limits: with zero listings, pages would be empty or thin, create maintenance burden, and could undermine user trust.
- Recommendation: reject for now.

### Option C — Inventory-first, then bounded programmatic discovery

Fix the production signals, recruit a dense initial category/region cohort, then publish only landing pages supported by real listings and unique value.

- Advantages: aligns content with user utility; makes local, amenity, schedule, and structured data truthful; supports measurable acquisition.
- Limits: slower initial URL growth and dependent on owner onboarding.
- Recommendation: **preferred**.

## Bounded recommendations

### P0 — Production discovery verification

Owner: delivery/engineering, after Daniel's normal review and deployment approval.

- Confirm the deployable revision includes self-canonicals and all intended static sitemap entries.
- After release, verify `/about`, `/contact`, `/vendors`, `/pricing`, `/terms`, `/privacy`, `/refund`, and `/accessibility` each return their own canonical.
- Verify the sitemap contains all intended indexable static URLs and only eligible active business URLs.
- Omit static `lastmod` unless it can reflect a real significant update; do not emit request time.
- Give `/vendors` an acquisition/benefits snippet and `/pricing` a duration/pricing snippet.

Expected impact: high prerequisite value; low direct traffic while inventory remains empty. Confidence: high.

### P1 — One acquisition wedge

Owner: Atlas/growth, with business-owner consent.

- Start with `עגלות קפה` and `פוד טראק` in one region rather than generic nationwide small businesses.
- Capture fields competitors and autocomplete prove useful: locality/region, accurate hours, open now, Saturday, kosher status, accessibility, playground/family suitability, protected space, parking, route/road, and direct navigation/contact.
- Do not invent or scrape owner-controlled attributes. Require owner confirmation and an update cadence.

Expected impact: critical for making the product and future SEO pages useful. Confidence: high on sequencing, medium on the exact first region because no first-party demand data is available.

### P2 — Three-page content experiment after inventory

Provisional gate: at least 10 verified, current listings in the chosen region/category, with no landing page containing fewer than three useful results. Atlas should revise this gate based on inventory quality.

Test no more than three page patterns:

1. category + region/city;
2. category + `פתוח עכשיו`/Saturday;
3. category + one differentiating amenity such as protected space or playground.

Each page should contain visible explanatory copy, crawlable links, result counts, current listings, and a clear empty-state/noindex rule. Avoid hundreds of parameter combinations.

Expected impact: medium to high after inventory density exists. Confidence: medium until Search Console data validates actual queries.

### P3 — Owner local-discovery checklist, not profile procurement

Google says local results are mainly based on relevance, distance, and prominence, and that complete accurate Business Profiles, reviews, and links can help. [Google local ranking guidance](https://support.google.com/business/answer/7091?hl=en-en)

- Give participating owners a checklist to maintain their own eligible [Google Business Profile](https://support.google.com/business/answer/7039811?hl=en-en), with accurate category, address/service area, hours, photos, and a link to their Po Finder profile where appropriate.
- Do not create, claim, or edit profiles on an owner's behalf without explicit authorization.
- Do not create a Po Finder Business Profile if it is online-only; Google's eligibility rules require in-person customer contact for ordinary businesses. [Eligibility guidance](https://support.google.com/business/answer/13763036?hl=en-GB)

Expected impact: high for individual owner local visibility and potential referral signals; indirect for Po Finder. Confidence: high.

## Maintained free tools

| Tool | Use | Gate / caveat |
|---|---|---|
| [Google Search Console](https://search.google.com/search-console/about) | Sitemap status, indexing, query/page clicks, impressions, CTR, position, URL Inspection. Google recommends focusing on click/impression trends more than position alone. [Performance guidance](https://support.google.com/webmasters/answer/17010961?hl=en) | Existing verification token is present in source, but Scout had no property access. Atlas/Daniel must authorize access/export. |
| [Google Trends](https://trends.google.com/explore) | Compare seasonal/regional interest for a small seed set. | Relative index, not absolute volume; low-volume Hebrew queries may be sparse. |
| [Bing Webmaster Tools](https://www.bing.com/webmasters/about?lang=en) | Free keyword research, site scan, backlinks, reporting, and sitemap management. | Register/import only with account-owner approval. |
| [Google Rich Results Test](https://search.google.com/test/rich-results) and [Schema Markup Validator](https://validator.schema.org/) | Validate `LocalBusiness` and visible-page alignment after real listings exist. | Valid markup does not guarantee a rich result. Google documents supported `LocalBusiness` fields including hours and reviews. [Structured-data guidance](https://developers.google.com/search/docs/appearance/structured-data/local-business) |
| Existing PostHog analytics | Measure listing impressions/views and contact/navigation actions from organic landing pages. | Preserve consent and current privacy model; define the funnel before evaluating content. |

No custom crawler or paid SEO platform is needed for the next step. A small maintained script that snapshots live sitemap URLs, canonicals, titles, response codes, and competitor sitemap counts is justified only after this baseline is accepted.

## Validation plan

### Immediately after an approved release

- Direct HTTP checks: response code, canonical, title, description, robots, and sitemap membership for every public static route.
- Confirm sitemap `lastmod` values are absent or meaningful.
- Search Console: submit/confirm the sitemap and inspect homepage, `/vendors`, `/pricing`, and one eventual listing URL.
- Structured data: validate one representative business page only after it is public and its visible data is complete.

### Weekly baseline

Use complete seven-day periods; compare with the preceding seven days and retain a 28-day context because a new site will be noisy.

- Search Console: non-branded impressions, clicks, CTR, indexed pages, and top query/page deltas. Search Console notes that query rows are truncated and anonymized, so exports are not a complete census. [Data limitations](https://support.google.com/webmasters/answer/17011259?hl=en)
- Product: organic landing visits → listing views → navigation/WhatsApp/call actions.
- Inventory: active verified listing count, listings with current hours, and stale-data rate.
- Competitors: sitemap count deltas, new article URLs/dates, new filters, and newly exposed city/road pages.

### Success criteria for the first content experiment

Over four complete weeks after indexation:

- all three test pages remain indexable and contain current inventory;
- non-branded impressions appear for at least one intended query cluster;
- impressions and clicks trend upward without a rise in stale/incorrect-hours reports;
- at least one organic session reaches a meaningful listing contact/navigation action.

Do not set a rank or traffic guarantee before first-party data exists.

## Risks and unresolved questions

| Risk / question | Status and owner |
|---|---|
| Which revision is actually approved for production, and why is production behind the checked-out SEO output? | Unresolved. Delivery/Atlas should reconcile revision and deployment status before requesting a release. |
| Does the Search Console property have any impressions, indexed URLs, manual actions, or sitemap errors? | Unverified. Requires an authorized export from the property owner. |
| Which region has enough reachable owners to form the first dense inventory cohort? | Unresolved. Atlas/growth choice; search sampling alone is insufficient. |
| Can owners reliably maintain schedule and amenity data? | Product/data-quality risk. Define confirmation and stale-data rules before exposing “open now” landing pages. |
| Could programmatic pages become thin or duplicative? | High if generated early. Mitigated by inventory thresholds, unique visible content, canonical rules, and noindex for empty states. |
| Is Po Finder eligible for its own Google Business Profile? | Likely no if online-only; do not register without confirming in-person eligibility and Daniel approval. |

## Source classification

- **Primary:** Po Finder live endpoints and checked-out source; Google Search Central/Business Profile documentation; Bing Webmaster Tools; competitor live pages and sitemaps.
- **Secondary/editorial:** Israel Hayom and Mako category coverage.
- **Inference/recommendation:** production appears behind the checked-out tree; coffee carts/food trucks are the preferred first wedge; inventory thresholds and the three-page experiment are proposed validation gates, not sourced facts.

