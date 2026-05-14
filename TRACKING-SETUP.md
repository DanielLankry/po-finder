# TRACKING-SETUP.md — פה (Po) Conversion Tracking Checklist

> **CRITICAL**: Do NOT spend any money on ads until steps 1-3 are complete.

---

## 1. Meta Pixel Installation

### Step 1: Create Meta Pixel
- [ ] Go to Meta Business Manager → Events Manager → Connect Data Sources → Web → Meta Pixel
- [ ] Name it: "Po Website Pixel"
- [ ] Copy the Pixel ID (format: 15-digit number)

### Step 2: Install Base Pixel Code

Add to `app/layout.tsx` in the `<head>`:

```html
<!-- Meta Pixel Code -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=YOUR_PIXEL_ID&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->
```

### Step 3: Configure Conversion Events

| Event | Where to Fire | Implementation |
|-------|---------------|----------------|
| `PageView` | Every page (auto from base pixel) | Already in base code |
| `Lead` | Pricing page CTA click | Fire on "התחילו עכשיו" button click |
| `InitiateCheckout` | Stripe checkout redirect | Fire before `window.location.href = data.url` |
| `Purchase` | After successful Stripe payment | Fire on `/auth/callback` or post-payment page |
| `ViewContent` | Business profile pages | Fire on `/businesses/[id]` pages |
| `AddToWishlist` | User adds a favorite | **NEW** — Fire in `useFavorites` hook toggle |
| `Schedule` | User views event details | **NEW** — Fire on event section interaction |

#### Lead Event (pricing page button click)
Add to the `handleSubscribe` function in `app/pricing/page.tsx`:
```javascript
// Before the fetch call
if (typeof fbq !== 'undefined') {
  fbq('track', 'Lead', { currency: 'USD', value: 5.00 });
}
```

#### Purchase Event (after Stripe success)
Add to the Stripe webhook handler or success redirect:
```javascript
if (typeof fbq !== 'undefined') {
  fbq('track', 'Purchase', { currency: 'USD', value: 5.00 });
}
```

#### ViewContent Event (business profiles)
Add to `app/businesses/[id]/page.tsx`:
```javascript
if (typeof fbq !== 'undefined') {
  fbq('track', 'ViewContent', { content_type: 'business' });
}
```

#### AddToWishlist Event (favorites — NEW)
Add to `lib/hooks/useFavorites.ts` in the toggle function:
```javascript
if (typeof fbq !== 'undefined') {
  fbq('track', 'AddToWishlist', { content_type: 'business', content_ids: [businessId] });
}
```

#### Schedule Event (event views — NEW)
Add to `components/business/EventsSection.tsx` when an event card is expanded/clicked:
```javascript
if (typeof fbq !== 'undefined') {
  fbq('track', 'Schedule', { content_type: 'event', content_ids: [eventId] });
}
```

### Step 4: Verify Pixel
- [ ] Install "Meta Pixel Helper" Chrome extension
- [ ] Visit po.co.il — should show PageView event
- [ ] Visit /pricing — should show PageView
- [ ] Click subscribe button — should show Lead event
- [ ] Complete test purchase — should show Purchase event
- [ ] Add a business to favorites — should show AddToWishlist event
- [ ] View an event on a business page — should show Schedule event
- [ ] Check Events Manager for events appearing in real-time

---

## 2. Google Analytics 4 (GA4) Installation

### Step 1: Create GA4 Property
- [ ] Go to analytics.google.com → Create Account → Create Property
- [ ] Property name: "Po Website"
- [ ] Reporting time zone: Israel (GMT+2/+3)
- [ ] Currency: ILS

### Step 2: Get Measurement ID
- [ ] Go to Admin → Data Streams → Add Web Stream
- [ ] Enter: po.co.il
- [ ] Copy Measurement ID (format: G-XXXXXXXXXX)

### Step 3: Install GA4

Add to `app/layout.tsx` in the `<head>`:

```html
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Step 4: Configure GA4 Events

| Event | Trigger | GA4 Code |
|-------|---------|----------|
| `sign_up` | Business completes registration | `gtag('event', 'sign_up', { method: 'email' })` |
| `purchase` | Stripe payment success | `gtag('event', 'purchase', { value: 5, currency: 'USD' })` |
| `begin_checkout` | Click subscribe button | `gtag('event', 'begin_checkout', { value: 5, currency: 'USD' })` |
| `view_item` | View business profile | `gtag('event', 'view_item', { item_name: business_name })` |
| `search` | Use map search/filter | `gtag('event', 'search', { search_term: query })` |
| `add_to_wishlist` | Add business to favorites | **NEW** — `gtag('event', 'add_to_wishlist', { item_name: business_name })` |
| `view_promotion` | View event on business page | **NEW** — `gtag('event', 'view_promotion', { promotion_name: event_name })` |

---

## 3. UTM Parameter Strategy

### Standard UTMs for All Ad Links

```
Base: https://po.co.il/{page}

Parameters:
?utm_source=meta
&utm_medium=paid
&utm_campaign={campaign_name}
&utm_content={ad_name}
```

### Campaign Names
| Campaign | utm_campaign Value |
|----------|-------------------|
| Business acquisition | `biz_acquisition` |
| Consumer awareness | `consumer_awareness` |
| Events promotion | `events` |
| Retargeting (future) | `retargeting` |

### Ad Names
| Ad | utm_content Value |
|----|------------------|
| FOMO map | `fomo_v1` |
| Price anchor | `price_v1` |
| Social proof | `proof_v1` |
| Multi-feature | `features_v1` |
| Events for biz | `biz_events_v1` |
| Discovery carousel | `discover_v1` |
| Local pride | `local_v1` |
| Events discovery | `events_v1` |
| Specific event | `event_{event_slug}` |

---

## 4. Verification Checklist

### Before Launching Ads
- [ ] Meta Pixel fires PageView on all pages
- [ ] Meta Pixel fires Lead on pricing CTA click
- [ ] Meta Pixel fires Purchase on successful payment
- [ ] Meta Pixel fires AddToWishlist on favorite toggle
- [ ] Meta Pixel fires Schedule on event interaction
- [ ] GA4 receiving pageview data
- [ ] GA4 events configured and tested
- [ ] UTM parameters resolve correctly (check GA4 → Acquisition → Traffic Acquisition)
- [ ] Mobile site loads in < 3 seconds (test with PageSpeed Insights)
- [ ] Pricing page works correctly on mobile
- [ ] Stripe checkout flow completes without errors
- [ ] OpenGraph images render correctly when sharing links on social media

### Weekly Monitoring
- [ ] Check Meta Events Manager → events are firing
- [ ] Check GA4 Realtime → traffic is being tracked
- [ ] Compare Meta reported clicks vs GA4 sessions (should be within 20%)
- [ ] Review conversion funnel: Visit → Lead → Purchase
- [ ] Check Favorites/AddToWishlist event volume (consumer engagement signal)
- [ ] Check event view volume (content engagement signal)

---

## 5. SEO Tracking (NEW)

Po now has sitemap.ts, robots.ts, and OpenGraph images. Track organic growth:

### Google Search Console
- [ ] Verify po.co.il in Google Search Console
- [ ] Submit sitemap (auto-generated at po.co.il/sitemap.xml)
- [ ] Monitor: impressions, clicks, CTR, average position
- [ ] Track indexed pages (each business profile should be indexed)

### Organic KPIs
| Metric | Month 1 | Month 3 | Month 6 |
|--------|---------|---------|---------|
| Indexed pages | Baseline | All business pages | All pages + events |
| Organic impressions | Track | 500+/month | 2,000+/month |
| Organic clicks | Track | 50+/month | 200+/month |
| Average position | Track | Top 20 for key terms | Top 10 for key terms |

---

## 6. Future: Meta Conversions API (CAPI)

When budget increases and you need better tracking accuracy:

- Meta Pixel alone misses ~20-30% of events due to ad blockers and iOS privacy
- CAPI sends events server-side (from your Next.js API routes)
- Implement when you have 50+ monthly conversions and budget > 1,000 NIS/month
- Use the Stripe webhook (`app/api/stripe/webhook/route.ts`) to fire server-side Purchase events

### Implementation outline:
```
Stripe webhook fires →
  Your API calls Meta CAPI endpoint →
    Meta receives Purchase event server-side →
      Deduplication with Pixel event via event_id
```

### Additional CAPI events to consider:
```
Favorite toggle (server action) →
  Fire AddToWishlist via CAPI →
    Dedup with client-side Pixel event

Event creation (business dashboard) →
  Fire custom "EventCreated" via CAPI →
    Track business engagement server-side
```

This is a Month 3+ optimization. Focus on Pixel + GA4 first.
