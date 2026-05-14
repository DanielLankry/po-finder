# CAMPAIGN-ARCHITECTURE.md — פה (Po) Campaign Structure

## Naming Convention

```
PO_{Platform}_{Track}_{Audience}_{Date}
```

Examples:
- `PO_META_BIZ_SmallBizOwners_2026-03`
- `PO_META_CONS_TLVFoodies_2026-03`
- `PO_META_EVENTS_TLVLocal_2026-03`

---

## Meta Ads Account Structure

```
Meta Business Manager
├── Ad Account: פה
│
├── Campaign 1: "עסקים — רכישת מנויים" (Track A)
│   ├── Objective: Leads → optimize for "Lead" event
│   ├── Budget: 6.5 NIS/day (195 NIS/month)
│   ├── Schedule: Always on
│   │
│   └── Ad Set: "בעלי עסקים קטנים — כל הארץ"
│       ├── Location: Israel (all)
│       ├── Age: 25-55
│       ├── Detailed targeting:
│       │   ├── Interests: Small business, entrepreneurship,
│       │   │   food truck, street food, bakery, coffee shop,
│       │   │   restaurant owner, self-employed
│       │   ├── Behaviors: Small business owners,
│       │   │   Facebook page admins
│       │   └── OR: Job titles containing בעל עסק, עצמאי
│       ├── Placements: Automatic (Advantage+)
│       ├── Optimization: Lead event
│       │
│       ├── Ad 1: "העסק שלך עדיין לא על המפה?" (FOMO)
│       │   ├── Format: Single image
│       │   ├── Image: Map screenshot with business pins
│       │   ├── Primary text: FOMO copy (see ADS-STRATEGY.md)
│       │   ├── Headline: הופיעו על המפה ב-5$/חודש
│       │   ├── CTA: Sign Up
│       │   └── URL: po.co.il/pricing?utm_source=meta&utm_medium=paid&utm_campaign=biz_acquisition&utm_content=fomo_v1
│       │
│       ├── Ad 2: "פחות מכוס קפה" (Price anchor)
│       │   ├── Format: Single image
│       │   ├── Image: Coffee cup + map visual
│       │   ├── Primary text: Price anchor copy
│       │   ├── Headline: 5$ בחודש. בלי התחייבות.
│       │   ├── CTA: Sign Up
│       │   └── URL: po.co.il/pricing?utm_source=meta&utm_medium=paid&utm_campaign=biz_acquisition&utm_content=price_v1
│       │
│       ├── Ad 3: "הצטרפו ל-X עסקים" (Social proof — add after 10+ businesses)
│       │   ├── Format: Single image
│       │   ├── Image: Map with multiple pins + counter
│       │   ├── Primary text: Social proof copy
│       │   ├── Headline: הצטרפו לעסקים שכבר על המפה
│       │   ├── CTA: Sign Up
│       │   └── URL: po.co.il/pricing?utm_source=meta&utm_medium=paid&utm_campaign=biz_acquisition&utm_content=proof_v1
│       │
│       └── Ad 4: "מפה + אירועים + לוח שבועי" (Multi-feature — NEW)
│           ├── Format: Single image
│           ├── Image: Feature checklist with checkmarks on brand background
│           ├── Primary text: Multi-feature copy (see ADS-STRATEGY.md Angle 5)
│           ├── Headline: הכל מה שהעסק שלך צריך
│           ├── CTA: Sign Up
│           └── URL: po.co.il/pricing?utm_source=meta&utm_medium=paid&utm_campaign=biz_acquisition&utm_content=features_v1
│
├── Campaign 2: "צרכנים — מודעות" (Track B)
│   ├── Objective: Traffic → optimize for landing page views
│   ├── Budget: 2.5 NIS/day (75 NIS/month)
│   ├── Schedule: Always on
│   │
│   └── Ad Set: "אוכל ומקומי — תל אביב מטרו"
│       ├── Location: Tel Aviv + 20km radius
│       ├── Age: 18-45
│       ├── Detailed targeting:
│       │   ├── Interests: Street food, food & drink,
│       │   │   local business, coffee culture,
│       │   │   farmers market, foodie
│       │   └── Behaviors: Frequent travelers (local),
│       │       food delivery app users
│       ├── Placements: Automatic (Advantage+)
│       ├── Optimization: Landing page views
│       │
│       ├── Ad 1: "גלו מה יש ליד הבית" (Discovery)
│       │   ├── Format: Carousel (3-4 cards showing different biz types)
│       │   ├── Primary text: Discovery copy
│       │   ├── Headline per card: פלאפל | קפה | מאפייה | עוד...
│       │   ├── CTA: Learn More
│       │   └── URL: po.co.il/?utm_source=meta&utm_medium=paid&utm_campaign=consumer_awareness&utm_content=discover_v1
│       │
│       ├── Ad 2: "תמכו בעסקים של השכונה" (Local pride)
│       │   ├── Format: Single image
│       │   ├── Image: Warm local business photo + map overlay
│       │   ├── Primary text: Local pride copy
│       │   ├── Headline: המפה של העסקים הקטנים
│       │   ├── CTA: Learn More
│       │   └── URL: po.co.il/?utm_source=meta&utm_medium=paid&utm_campaign=consumer_awareness&utm_content=local_v1
│       │
│       └── Ad 3: "מה קורה ליד הבית?" (Events discovery — NEW)
│           ├── Format: Single image
│           ├── Image: Calendar/map mashup with event pins
│           ├── Primary text: Events discovery copy (see ADS-STRATEGY.md Angle 3)
│           ├── Headline: אירועים של עסקים קטנים ליד הבית
│           ├── CTA: Learn More
│           └── URL: po.co.il/?utm_source=meta&utm_medium=paid&utm_campaign=consumer_awareness&utm_content=events_v1
│
├── Campaign 3: "אירועים" (Track C — NEW)
│   ├── Objective: Traffic → optimize for landing page views
│   ├── Budget: 1 NIS/day (30 NIS/month)
│   ├── Schedule: Run 3-5 days before event, stop day after
│   │
│   └── Ad Set: "אירוע — [Event Name]"
│       ├── Location: 10km radius around event location
│       ├── Age: 18-45
│       ├── Detailed targeting: Same as Track B
│       ├── Placements: Automatic (Advantage+)
│       ├── Optimization: Landing page views
│       │
│       └── Ad: "[Event Name] ב[Location]"
│           ├── Format: Single image
│           ├── Image: Event visual or business photo
│           ├── Primary text: Event details + date + location
│           ├── Headline: [Event name] — [Date]
│           ├── CTA: Learn More
│           └── URL: po.co.il/businesses/{id}?utm_source=meta&utm_medium=paid&utm_campaign=events&utm_content={event_slug}
│
└── [Future] Campaign 4: "ריטרגטינג — ביקרו ולא נרשמו"
    ├── Objective: Conversions → Purchase event
    ├── Budget: Reallocate from Track B once pixel has 1,000+ events
    │
    └── Ad Set: "ביקרו בדף מחירים — 14 יום"
        ├── Custom Audience: Pricing page visitors, 14-day window
        ├── Exclude: Existing subscribers (Purchase event)
        ├── Additional audience: Users who added favorites but didn't return (7+ days)
        └── Ad: Urgency/reminder messaging
```

---

## Audience Definitions

### Custom Audiences (build over time)

| Audience | Source | Min Size | Use |
|----------|--------|----------|-----|
| All site visitors | Pixel - PageView | 100+ | Retargeting base |
| Pricing page visitors | Pixel - URL contains /pricing | 100+ | Hot retargeting |
| Subscribers | Pixel - Purchase event | 50+ | Exclude + Lookalike seed |
| Engaged visitors | Pixel - 2+ page views | 100+ | Warm retargeting |
| Favorites users | Pixel - AddToWishlist event | 50+ | **NEW** — High-intent consumer retargeting |
| Event viewers | Pixel - Schedule event | 50+ | **NEW** — Event-interested consumers |

### Lookalike Audiences (build once seeds are large enough)

| Seed Audience | Min Seed | Lookalike % | Use |
|---------------|----------|-------------|-----|
| Subscribers | 50 | 1% Israel | Best business prospects |
| Site visitors | 500 | 1% Israel | Consumer expansion |
| Favorites users | 100 | 1% Tel Aviv metro | **NEW** — Engaged consumer expansion |

---

## Ad Specs Quick Reference

| Element | Limit | Best Practice |
|---------|-------|--------------|
| Primary text | 125 chars before "more" | Front-load key message |
| Headline | 40 chars | Clear value prop |
| Description | 30 chars | Supporting detail |
| Image ratio | 1:1 (feed), 9:16 (stories) | Design for 1:1, crop for 9:16 |
| Image size | 1080x1080 (1:1) | Min 600x600 |
| Video length | 15-30s | Hook in first 3 seconds |
| Carousel cards | 2-10 | 3-4 optimal |
| Text on image | < 20% | Less text = more reach |

---

## Optimization Rules

### Kill Rules (apply after 1,000+ impressions per ad)
- CTR < 1.0% → Kill the ad
- CPC > 5 NIS (Track A) or > 2 NIS (Track B/C) → Kill the ad
- No conversions after 100 NIS spend (Track A) → Kill the ad
- Frequency > 3.0 → Refresh creative or expand audience
- Track C event ad with < 0.5% CTR after 500 impressions → Kill (time-sensitive, can't wait)

### Scale Rules
- CTR > 3% AND CPC < target → Increase budget by 20% (no more)
- Winning ad identified → Create 2 variations (same angle, different visual/copy)
- Never increase budget by more than 20% at a time (resets learning phase)

### Testing Cadence
- Week 1-2: Run initial ads, gather data
- Week 3: Kill losers, create 1-2 new variations of winner
- Week 4: Evaluate month, plan next month's creative
- Every 2-3 weeks: Refresh at least 1 creative to combat fatigue
- Track C: Evaluate per-event (each event ad is a short-lived test)
