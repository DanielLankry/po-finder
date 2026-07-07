# Pricing v2 — Yearly Listing + Monthly Boost

**Date:** 2026-07-07
**Status:** Approved by Daniel

## Goal

Replace the 30/60/90-day duration ladder with two one-shot products:

| Product | Price | Grants |
|---------|-------|--------|
| Listing | ₪15 (1500 agorot) | Business listed for 365 days. Renew ₪15/year. |
| Boost | ₪20 (2000 agorot) | 30 days of extra visibility. Buy again to extend. |

No recurring billing — HYP integration stays one-shot. Boost is "buy a month at a time".

## Decisions (locked)

- Listing = yearly renewal via existing `expires_at`.
- Boost grants: top of search/category lists + homepage featured section + visible "promoted" badge.
- Boost **stacks by extending**: new purchase extends from `max(now, boost_expires_at)` + 30 days.
- Boost is **per-business** — multi-business owners boost each business separately.
- Boost never grants listing rights (`user_is_subscribed()` counts listing payments only).
- Existing live businesses keep their current `expires_at`; renew at ₪15 when it lapses. No backfill. `boost_expires_at` starts null.
- All user-facing flows must be optimized for mobile.

## Schema — migration `021_pricing_v2.sql`

- `plans`: add `kind text NOT NULL DEFAULT 'listing' CHECK (kind IN ('listing','boost'))`. Reseed table with exactly two rows:
  - `kind='listing', days=365, label='רישום שנתי', price=1500`
  - `kind='boost', days=30, label='קידום חודשי', price=2000`
- `businesses`: add `boost_expires_at timestamptz`. Boosted ⇔ `boost_expires_at IS NOT NULL AND boost_expires_at > now()`.
- `payment_attempts`: add `kind text NOT NULL DEFAULT 'listing' CHECK (kind IN ('listing','boost'))`.
- Rewrite `consume_payment_for_business()` trigger: only consume `kind='listing'` attempts; apply `expires_at = now() + plan_days`.
- Patch `user_is_subscribed()`: unconsumed-payment clause filters `kind='listing'`.

## Payments

- `lib/plans.ts` / `lib/plans-server.ts`: `Plan` gains `kind`; add `getPlanByKind(kind)`. Static fallback = the two new plans.
- `POST /api/payments/checkout`: body becomes `{ kind: 'listing'|'boost', businessId? }`. Boost **requires** `businessId` owned by the user. Records `kind` on the attempt.
- `GET /api/payments/return`: on verified success, branch on `attempt.kind`:
  - listing + businessId → extend `expires_at = max(now, expires_at) + plan_days`
  - listing + no businessId → leave unconsumed (trigger consumes on business insert, as today)
  - boost → extend `boost_expires_at = max(now, boost_expires_at) + plan_days` on the linked business
- Refund flow unchanged (per-attempt).

## Public site

- `/pricing`: two-card layout (₪15/year listing, ₪20/month boost). Mobile: stacked cards.
- Search + category/list queries: order boosted businesses first (`boost_expires_at > now()` desc/first), then existing ordering.
- Homepage: "עסקים מקודמים" featured section showing active-boost businesses (hide section when none).
- `PromotedBadge` component on boosted business cards + business detail page.

## Dashboard (`/dashboard/billing`)

- Listing status card: expiry date, "חדש רישום" button → checkout(kind=listing, businessId).
- Boost status card: active until date or "לא מקודם", "קדם עסק" / "הארך קידום" button → checkout(kind=boost, businessId).
- Mobile-first layout.

## Admin

- `/admin/pricing`: repurpose editor to exactly two fixed rows (listing price/days, boost price/days) — no arbitrary ladder add/remove. API validates the two kinds.
- `/admin/boosts` (new): table of businesses with boost state, `boost_expires_at`, manual grant (+30d) / revoke actions, boost revenue this month. New API route `api/admin/boosts`.
- `/admin` home: add cards — active boosts count, revenue this month (sum succeeded attempts), recent payments list.

## Testing / verification

- Playwright + build must pass.
- /loop-driven verify cycle after implementation: exercise pricing page, checkout start (up to HYP redirect), dashboard billing, admin pages — with mobile viewport (390×844) checks for all user-facing pages.

## Out of scope

- Auto-recurring billing / card tokens.
- Reminder emails for boost expiry (future).
- Backfill or conversion of historical payment rows.
