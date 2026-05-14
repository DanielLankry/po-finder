# BUDGET-PLAN.md — פה (Po) Budget Allocation

## Monthly Budget: 300 NIS (~$80 USD)

---

## Allocation

| Track | Monthly | Daily | % | Purpose |
|-------|---------|-------|---|---------|
| A: Business Acquisition | 195 NIS | 6.5 NIS | 65% | Revenue-generating subscribers |
| B: Consumer Awareness | 75 NIS | 2.5 NIS | 25% | Platform usage / social proof |
| C: Events Promotion | 30 NIS | 1 NIS | 10% | Boost specific business events |
| **Total** | **300 NIS** | **10 NIS** | **100%** | |

---

## Why 65/25/10 Split

- **Revenue comes from businesses**, not consumers. Every business paying $5/month funds growth.
- Consumers use the platform for free — their value is indirect (they make the platform attractive to businesses).
- **Events promotion (10%)** is a new track that creates time-sensitive, shareable content. Even at 1 NIS/day, event ads drive local foot traffic and demonstrate platform value to business owners.
- At 300 NIS/month, splitting more than 3 ways makes each track too small to optimize.
- **Track C is elastic**: If no events exist on the platform, redistribute its 30 NIS to Track A (making it 225 NIS / 7.5 NIS per day).

---

## Monthly Pacing

### Month 1 — Learning Phase
| Week | Track A | Track B | Track C | Notes |
|------|---------|---------|---------|-------|
| 1 | 49 NIS | 0 NIS | 0 NIS | Focus entirely on Track A first |
| 2 | 49 NIS | 18 NIS | 0 NIS | Launch Track B |
| 3 | 49 NIS | 18 NIS | 8 NIS | Launch Track C if events exist |
| 4 | 48 NIS | 39 NIS | 22 NIS | Full run, analyze results |
| **Total** | **195 NIS** | **75 NIS** | **30 NIS** | |

> **Week 1 strategy**: Launch only Track A to concentrate spend and exit Meta's learning phase faster. Track B starts Week 2. Track C starts Week 3 (only if businesses have created events).

### Month 2 — Optimization
- Kill underperforming ads (see CAMPAIGN-ARCHITECTURE.md kill rules)
- Reallocate within tracks based on performance
- If Track A CPA > 80 NIS after 2 weeks: pause, reassess targeting/creative
- If Track B CPC < 1 NIS: consider increasing Track B allocation
- If Track C drives measurable event attendance: consider increasing to 15%
- If no events on platform: fold Track C into Track A

### Month 3+ — Steady State
- Maintain allocation split unless data shows otherwise
- Refresh creatives every 2-3 weeks
- Monthly performance review → adjust allocations
- Track C scales naturally as more businesses create events

---

## Break-Even Analysis

### Unit Economics
| Metric | Value |
|--------|-------|
| Subscription price | $5/month (~18 NIS) |
| Average customer lifetime | 6-12 months (estimate) |
| LTV (6-month) | $30 (~108 NIS) |
| LTV (12-month) | $60 (~216 NIS) |
| Target CPA (3-month payback) | < 54 NIS |
| Target CPA (1-month payback) | < 18 NIS |

### Why LTV Should Improve (New Features)
The Events and weekly schedule features increase business owner engagement, which should improve retention:
- Businesses that create events are more invested in the platform
- Weekly schedule management creates a habit loop (check/update → value)
- Multi-business support (BusinessSelector) means power users can manage multiple listings
- **Estimated LTV improvement**: +15-25% over baseline (more features → lower churn)

### Monthly Break-Even Scenarios

| Scenario | New Subscribers | CPA | Monthly Revenue | Profit vs. Ad Spend |
|----------|----------------|-----|-----------------|---------------------|
| Pessimistic | 3 | 100 NIS | 54 NIS | -246 NIS |
| Conservative | 5 | 60 NIS | 90 NIS | -210 NIS |
| Target | 8 | 38 NIS | 144 NIS | -156 NIS |
| Optimistic | 12 | 25 NIS | 216 NIS | -84 NIS |

> **Reality check**: At 300 NIS/month, paid ads alone won't be profitable in Month 1. The strategy depends on:
> 1. Organic channels (Facebook groups, WhatsApp outreach) bringing 5-10 free subscribers/month
> 2. Subscriber retention (LTV > CPA over 3-6 months)
> 3. Network effects (more businesses → more consumers → easier to sell)
> 4. SEO (now live with sitemap + robots.txt) reducing paid dependency over time

---

## Reinvestment Schedule

| Revenue Milestone | Monthly Revenue | Ad Budget Action |
|-------------------|----------------|------------------|
| 20 businesses | 360 NIS | Reinvest 50% → 480 NIS total budget |
| 50 businesses | 900 NIS | Reinvest 50% → 750 NIS total budget |
| 100 businesses | 1,800 NIS | Add Google Search (500 NIS) |
| 200 businesses | 3,600 NIS | Full multi-platform (see scaling plan) |

---

## Cost Benchmarks (Israel — Meta Ads)

| Metric | Israel Average | Po Target |
|--------|---------------|-----------|
| CPM (cost per 1,000 impressions) | 20-40 NIS | 25 NIS |
| CPC (cost per click) | 1.5-4 NIS | < 3 NIS (Track A), < 1.5 NIS (Track B) |
| CTR (click-through rate) | 1.5-3% | > 2% |
| CVR (landing page → Lead) | 3-8% | > 5% |
| CPL (cost per lead/signup) | 15-60 NIS | < 50 NIS |

### Expected Monthly Reach (at 300 NIS)
| Track | Est. Impressions | Est. Clicks | Est. Conversions |
|-------|-----------------|-------------|-----------------|
| A: Business (195 NIS) | 5,000-8,000 | 50-90 | 3-7 leads |
| B: Consumer (75 NIS) | 2,500-4,000 | 30-50 | N/A (traffic goal) |
| C: Events (30 NIS) | 1,000-2,000 | 10-20 | N/A (traffic goal) |

---

## What NOT to Spend On

| Temptation | Why Not |
|------------|---------|
| Google Search Ads | CPC too high for 300 NIS budget. Need 1,000+ NIS/month minimum. |
| TikTok Ads | Requires video content you don't have + minimum budgets are higher. |
| Boosting Facebook posts | Less control than Ads Manager. Always use Ads Manager. |
| Multiple ad sets per track | Splits budget too thin. 1 ad set per track maximum. |
| Brand awareness objective | Vanity metrics. Optimize for Leads (Track A) and Traffic (Track B/C). |
| Influencer marketing | Too expensive at this stage. Revisit at 100+ businesses. |
| Event ads without events | Don't run Track C if no businesses have created events yet. |
