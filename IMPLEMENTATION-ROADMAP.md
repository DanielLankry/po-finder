# IMPLEMENTATION-ROADMAP.md — פה (Po) Phased Rollout

---

## Phase 1 — Foundation (Days 1-7)

### Day 1-2: Tracking
| # | Task | Status |
|---|------|--------|
| 1 | Create Meta Business Manager account | ☐ |
| 2 | Create Meta Pixel, get Pixel ID | ☐ |
| 3 | Install Meta Pixel on po.co.il (see TRACKING-SETUP.md) | ☐ |
| 4 | Configure Lead event on pricing page | ☐ |
| 5 | Configure Purchase event on payment success | ☐ |
| 6 | Configure AddToWishlist event on favorites toggle | ☐ |
| 7 | Configure Schedule event on event interaction | ☐ |
| 8 | Verify Pixel with Meta Pixel Helper extension | ☐ |
| 9 | Create GA4 property + install tracking code | ☐ |
| 10 | Verify GA4 Realtime shows page views | ☐ |
| 11 | Verify po.co.il in Google Search Console | ☐ |
| 12 | Submit sitemap to Google Search Console | ☐ |

### Day 3-4: Accounts & Pages
| # | Task | Status |
|---|------|--------|
| 13 | Create Facebook Page for "פה" (if not existing) | ☐ |
| 14 | Create Instagram Business account, link to FB Page | ☐ |
| 15 | Set up Meta Ads Manager (link Pixel, Page, payment) | ☐ |
| 16 | Add payment method to Meta Ads (credit card) | ☐ |
| 17 | Set account spending limit: 350 NIS/month (safety buffer) | ☐ |

### Day 5-7: Creative Production
| # | Task | Status |
|---|------|--------|
| 18 | Create Canva account (free) | ☐ |
| 19 | Design Ad A1: "העסק שלך עדיין לא על המפה?" (1080x1080) | ☐ |
| 20 | Design Ad A2: "פחות מכוס קפה" (1080x1080) | ☐ |
| 21 | Design Ad A3: "רשימת פיצ'רים" — include events + weekly schedule (1080x1080) | ☐ |
| 22 | Design Ad A4: "אירועים ולוח שבועי" (1080x1080) | ☐ |
| 23 | Design Ad B1: Discovery carousel (4x 1080x1080) | ☐ |
| 24 | Design Ad B2: "תמכו בשכונה" (1080x1080) | ☐ |
| 25 | Design Ad B3: "מה קורה ליד הבית?" events discovery (1080x1080) | ☐ |
| 26 | Create Ad C1: Event template in Canva (reusable) | ☐ |
| 27 | Take real screenshots of Po map for ad visuals | ☐ |
| 28 | Take screenshots of Events dashboard + weekly schedule for A4 | ☐ |

---

## Phase 2 — Launch Track A (Days 8-14)

### Day 8: Build Campaign
| # | Task | Status |
|---|------|--------|
| 29 | Create Campaign: "עסקים — רכישת מנויים" | ☐ |
|    | - Objective: Leads | |
|    | - Campaign budget: 6.5 NIS/day | |
| 30 | Create Ad Set: "בעלי עסקים קטנים — כל הארץ" | ☐ |
|    | - Location: Israel | |
|    | - Age: 25-55 | |
|    | - Interests: Small business, entrepreneurship, food biz | |
|    | - Placements: Advantage+ (automatic) | |
|    | - Optimization: Lead event | |
| 31 | Upload Ad A1, A2, A3, A4 with copy (see CAMPAIGN-ARCHITECTURE.md) | ☐ |
| 32 | Set UTM parameters on all ad URLs | ☐ |
| 33 | Submit for review → publish | ☐ |

### Days 9-14: Monitor
| # | Task | Status |
|---|------|--------|
| 34 | Day 9: Check ad approval status | ☐ |
| 35 | Day 10: Verify Pixel events in Events Manager | ☐ |
| 36 | Day 11: Check CTR, CPC, impressions | ☐ |
| 37 | Day 12: Check if any conversions (Lead events) | ☐ |
| 38 | Day 14: First week review — note winning/losing ads | ☐ |

---

## Phase 3 — Launch Track B + C (Days 15-21)

### Day 15: Build Consumer Campaign
| # | Task | Status |
|---|------|--------|
| 39 | Create Campaign: "צרכנים — מודעות" | ☐ |
|    | - Objective: Traffic (landing page views) | |
|    | - Campaign budget: 2.5 NIS/day | |
| 40 | Create Ad Set: "אוכל ומקומי — תל אביב מטרו" | ☐ |
|    | - Location: Tel Aviv + 20km | |
|    | - Age: 18-45 | |
|    | - Interests: Street food, local food, coffee | |
|    | - Placements: Advantage+ | |
|    | - Optimization: Landing page views | |
| 41 | Upload Ad B1 (carousel), B2 (local pride), B3 (events discovery) | ☐ |
| 42 | Submit for review → publish | ☐ |

### Day 16: Build Events Campaign (if events exist on platform)
| # | Task | Status |
|---|------|--------|
| 43 | Create Campaign: "אירועים" | ☐ |
|    | - Objective: Traffic | |
|    | - Campaign budget: 1 NIS/day | |
| 44 | Create Ad Set: location-based around event | ☐ |
|    | - Location: 10km radius around event | |
|    | - Age: 18-45 | |
|    | - Schedule: 3-5 days before event, stop day after | |
| 45 | Create event ad using C1 template | ☐ |
| 46 | Submit for review → publish | ☐ |

> **Note**: If no businesses have created events yet, skip Track C and redistribute its 30 NIS/month to Track A (total: 225 NIS/month, 7.5 NIS/day).

### Days 17-21: Monitor All Tracks
| # | Task | Status |
|---|------|--------|
| 47 | Daily: Check spend is pacing correctly across all tracks | ☐ |
| 48 | Day 18: Compare ad performance within each campaign | ☐ |
| 49 | Day 21: Kill any ad with CTR < 1% (1,000+ impressions) | ☐ |
| 50 | Day 21: Check AddToWishlist events (consumer engagement) | ☐ |

---

## Phase 4 — Optimize (Days 22-30)

| # | Task | Status |
|---|------|--------|
| 51 | Apply kill rules from CAMPAIGN-ARCHITECTURE.md | ☐ |
| 52 | Identify winning ad per track | ☐ |
| 53 | Create 1-2 new variations of winning ad (same angle, new visual) | ☐ |
| 54 | Pause losing ads, replace with new variations | ☐ |
| 55 | Review full month metrics (see below) | ☐ |
| 56 | Plan Month 2 creative refresh | ☐ |
| 57 | Check Google Search Console for organic traffic baseline | ☐ |
| 58 | Encourage listed businesses to create their first event | ☐ |

### Month 1 Review Template
```
Track A (Business Acquisition):
- Total spend: ___ NIS (of 195 budget)
- Impressions: ___
- Clicks: ___
- CTR: ___% (target: >1.5%)
- CPC: ___ NIS (target: <3 NIS)
- Lead events: ___
- CPL: ___ NIS (target: <50 NIS)
- Actual subscribers: ___
- CPA: ___ NIS
- Best performing ad: ___

Track B (Consumer Awareness):
- Total spend: ___ NIS (of 75 budget)
- Impressions: ___
- Clicks: ___
- CTR: ___% (target: >2%)
- CPC: ___ NIS (target: <1.5 NIS)
- New site visitors: ___
- AddToWishlist events: ___

Track C (Events):
- Total spend: ___ NIS (of 30 budget)
- Events promoted: ___
- Impressions: ___
- Clicks: ___
- Was it worth it? (Y/N): ___

Organic / SEO:
- Google Search Console impressions: ___
- Organic clicks: ___
- Pages indexed: ___
- Social shares (OG image views): ___

Overall:
- Total new subscribers (paid + organic): ___
- Revenue from subscribers: ___ NIS
- Net cost: ___ NIS
- Favorites added (consumer engagement): ___
- Events created by businesses: ___
- Decision: Scale / Maintain / Pivot
```

---

## Ongoing: Organic Growth (Start Day 1, Never Stop)

These run parallel to paid ads and cost zero money:

### Weekly Tasks
| Day | Task | Time |
|-----|------|------|
| Sunday | Post 1 Instagram Reel (business showcase) | 30 min |
| Monday | Post in 2-3 Facebook business owner groups | 20 min |
| Tuesday | Post 1 Instagram Story (map tip) | 10 min |
| Wednesday | Send 5 WhatsApp messages to potential businesses | 30 min |
| Wednesday | Post "אירוע השבוע" story if events exist on platform | 10 min |
| Thursday | Post 1 Instagram feed post (עסק השבוע) | 20 min |
| Friday | Engage with comments, reply to DMs | 15 min |
| Saturday | Check Google Search Console for new queries | 10 min |

**Expected weekly time investment: ~2.5 hours**
**Expected monthly organic signups: 5-10 businesses**

---

## Milestone Checkpoints

| Milestone | Expected | Action If Not Met |
|-----------|----------|-------------------|
| Pixel fires correctly | Day 2 | Do not proceed until fixed |
| Google Search Console verified | Day 3 | Submit sitemap, verify |
| First ad impression | Day 9 | Check ad approval, targeting |
| First website click from ad | Day 10 | Check landing page, CTR |
| First Lead event | Day 14 | Check event setup, pricing page UX |
| First AddToWishlist event | Day 14 | Check consumer engagement flow |
| First paying subscriber from ads | Day 21 | Reassess targeting/creative/offer |
| First business event created | Day 21 | Encourage listed businesses via WhatsApp |
| 5 paying subscribers total | Day 30 | Validate business model works |
| First organic search click | Day 30 | Check Search Console, optimize titles |
| 20 paying subscribers | Day 60 | Begin reinvestment (increase budget) |
| 50 paying subscribers | Day 90 | Add Google Search, expand strategy |
| 10+ events on platform monthly | Day 90 | Scale Track C budget |
