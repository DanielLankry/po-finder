# Pricing v2 — Yearly Listing + Monthly Boost — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 30/60/90-day plan ladder with two one-shot products — ₪15/year listing and ₪20/30-day visibility boost — plus admin tooling to manage both.

**Architecture:** Extend the existing HYP one-shot payment pipeline with a `kind` discriminator ('listing' | 'boost'). Listing keeps `businesses.expires_at`; boost adds `businesses.boost_expires_at`. Public queries sort boosted businesses first and mark them with a badge. Admin gets a fixed two-row pricing editor, a boosts management page, and revenue cards on the home dashboard.

**Tech Stack:** Next.js 16 App Router, Supabase (Postgres + RLS), HYP one-shot checkout, Tailwind, Playwright.

## Global Constraints

- Prices in agorot in DB: listing = 1500 (₪15), boost = 2000 (₪20). Listing days = 365, boost days = 30.
- Hebrew RTL UI (`dir="rtl"`), site palette: green `#2D6A4F`/`#1F5038`, cream `#F7F3EA`, amber for boost accents.
- All user-facing pages must work at mobile viewport 390×844 (stacked cards, no horizontal overflow).
- Boost never grants listing rights; `user_is_subscribed()` counts only `kind='listing'`.
- Boost extends from `max(now, boost_expires_at) + 30 days`; listing renewal extends from `max(now, expires_at) + 365 days` (already the return-route behavior).
- No recurring billing, no card tokens.
- No unit-test runner in repo — verification per task is `npx tsc --noEmit` + `npm run build` where noted, Playwright smoke specs for public pages, and a final /loop browser verify pass.
- Commit after every task.

## File Structure

- `supabase/migrations/021_pricing_v2.sql` — new (schema, reseed, trigger, RLS fn)
- `lib/plans.ts`, `lib/plans-server.ts` — modify (kind, fallbacks, `getPlanByKind`)
- `app/api/payments/checkout/route.ts` — modify (kind-based body)
- `app/api/payments/return/route.ts` — modify (boost settle branch)
- `app/pricing/page.tsx`, `app/pricing/PricingClient.tsx` — rewrite (two-card layout)
- `app/api/businesses/route.ts` — modify (select + sort boost first, expose `boosted`)
- `components/business/PromotedBadge.tsx` — new
- `components/business/BusinessCard.tsx` — modify (badge)
- `app/dashboard/billing/page.tsx` — rewrite rows (listing + boost status, buy buttons)
- `app/api/admin/pricing/route.ts` — modify (validate exactly the two kinds)
- `app/admin/pricing/PricingEditor.tsx`, `app/admin/pricing/page.tsx` — rewrite (two fixed rows)
- `app/api/admin/boosts/route.ts` — new (list + grant/revoke)
- `app/admin/boosts/page.tsx` — new
- `app/admin/layout.tsx` — modify (nav item)
- `app/admin/page.tsx` — modify (revenue/boost cards + recent payments)
- `tests/pricing-v2.spec.ts` — new (Playwright smoke, desktop + mobile viewport)

---

### Task 1: Migration `021_pricing_v2.sql`

**Files:**
- Create: `supabase/migrations/021_pricing_v2.sql`

**Interfaces:**
- Produces: `plans.kind` column; `businesses.boost_expires_at`; `payment_attempts.kind`; updated `consume_payment_for_business()` and `user_is_subscribed()`.

- [ ] **Step 1: Write the migration**

```sql
-- Pricing v2: yearly listing (₪15/365d) + monthly boost (₪20/30d).
-- Replaces the 30/60/90 duration ladder. Boost = extra visibility only,
-- never grants listing rights.

-- 1. plans: add kind, reseed to exactly two rows.
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'listing'
  CHECK (kind IN ('listing', 'boost'));

DELETE FROM public.plans;
INSERT INTO public.plans (sort_order, days, label, price, kind) VALUES
  (0, 365, 'רישום שנתי',  1500, 'listing'),
  (1, 30,  'קידום חודשי', 2000, 'boost');

-- 2. businesses: boost expiry. Boosted ⇔ boost_expires_at > now().
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS boost_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS businesses_boosted_idx
  ON public.businesses (boost_expires_at)
  WHERE boost_expires_at IS NOT NULL;

-- 3. payment_attempts: kind discriminator. Existing rows are listings.
ALTER TABLE public.payment_attempts
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'listing'
  CHECK (kind IN ('listing', 'boost'));

-- 4. Trigger consumes only unconsumed LISTING credits on business insert.
CREATE OR REPLACE FUNCTION public.consume_payment_for_business()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  attempt_id uuid;
  attempt_days integer;
BEGIN
  IF NEW.expires_at IS NOT NULL THEN
    RETURN NULL;
  END IF;

  SELECT id, plan_days
    INTO attempt_id, attempt_days
  FROM public.payment_attempts
  WHERE user_id = NEW.owner_id
    AND status = 'succeeded'
    AND kind = 'listing'
    AND business_id IS NULL
  ORDER BY completed_at DESC
  LIMIT 1;

  IF attempt_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.businesses
     SET expires_at = now() + (attempt_days || ' days')::interval
   WHERE id = NEW.id;

  UPDATE public.payment_attempts
     SET business_id = NEW.id
   WHERE id = attempt_id;

  RETURN NULL;
END;
$$;

-- 5. Subscription predicate: only listing payments count.
CREATE OR REPLACE FUNCTION public.user_is_subscribed()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND subscription_status IN ('active', 'past_due')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.payment_attempts
      WHERE user_id = auth.uid()
      AND status = 'succeeded'
      AND kind = 'listing'
      AND business_id IS NULL
    )
    OR
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE owner_id = auth.uid()
      AND expires_at IS NOT NULL
      AND expires_at > now()
    );
$$;
```

- [ ] **Step 2: Apply and regenerate types**

Run: `npm run db:push` then `npm run db:gen-types`
Expected: push succeeds; `lib/database.types.ts` gains `boost_expires_at` on businesses and `kind` on plans/payment_attempts.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/021_pricing_v2.sql lib/database.types.ts
git commit -m "feat(db): pricing v2 schema — listing/boost kinds, boost_expires_at"
```

---

### Task 2: Plans library

**Files:**
- Modify: `lib/plans.ts`
- Modify: `lib/plans-server.ts`

**Interfaces:**
- Produces: `type PlanKind = 'listing' | 'boost'`; `Plan = { kind, days, label, price }`; `getPlanByKind(kind): Promise<Plan | null>` (server); static `PLANS` fallback with the two new plans. Keeps `getPlans()` and `getPlanByDays()` signatures.

- [ ] **Step 1: Rewrite `lib/plans.ts`**

```ts
export type PlanKind = "listing" | "boost";
export type Plan = { kind: PlanKind; days: number; label: string; price: number };
export type PlanDays = number;

// Static fallback used when DB is unreachable.
export const PLANS: Plan[] = [
  { kind: "listing", days: 365, label: "רישום שנתי",  price: 1500 },
  { kind: "boost",   days: 30,  label: "קידום חודשי", price: 2000 },
];

export function getPlanByIndex(plans: Plan[], index: number): Plan {
  return plans[Math.max(0, Math.min(index, plans.length - 1))];
}

export function getPlanCount(plans: Plan[]): number {
  return plans.length;
}

export function getPriceForDays(plans: Plan[], days: number): number {
  return (
    [...plans].sort(
      (a, b) => Math.abs(a.days - days) - Math.abs(b.days - days)
    )[0]?.price ?? plans[0]?.price ?? 0
  );
}
```

- [ ] **Step 2: Update `lib/plans-server.ts`**

```ts
import { adminClient } from "./supabase/admin";
import { PLANS } from "./plans";
import type { Plan, PlanKind } from "./plans";

export async function getPlans(): Promise<Plan[]> {
  try {
    const db = adminClient();
    const { data, error } = await db
      .from("plans")
      .select("kind, days, label, price")
      .order("sort_order", { ascending: true });
    if (error || !data?.length) return [...PLANS];
    return data as Plan[];
  } catch {
    return [...PLANS];
  }
}

export async function getPlanByKind(kind: PlanKind): Promise<Plan | null> {
  const plans = await getPlans();
  return plans.find((p) => p.kind === kind) ?? null;
}

export async function getPlanByDays(days: number): Promise<Plan | null> {
  const plans = await getPlans();
  return plans.find((p) => p.days === days) ?? null;
}
```

- [ ] **Step 3: Fix compile fallout**

Run: `npx tsc --noEmit`
Any consumer constructing `Plan` without `kind` will fail — fix each site (`app/pricing/*`, `app/admin/pricing/*` get rewritten in later tasks; add `kind` minimally if needed to keep compiling).
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add lib/plans.ts lib/plans-server.ts
git commit -m "feat(plans): kind discriminator + getPlanByKind"
```

---

### Task 3: Checkout route — kind-based

**Files:**
- Modify: `app/api/payments/checkout/route.ts`

**Interfaces:**
- Consumes: `getPlanByKind` from Task 2.
- Produces: `POST /api/payments/checkout` accepting `{ kind: 'listing'|'boost', businessId?: uuid }`. Boost requires `businessId`. Response unchanged: `{ ok, id, url }`.

- [ ] **Step 1: Replace schema + plan lookup + insert**

In `app/api/payments/checkout/route.ts`:

```ts
import { getPlanByKind } from "@/lib/plans-server";

const checkoutSchema = z.object({
  kind: z.enum(["listing", "boost"]),
  businessId: z.string().uuid().optional(),
});
```

After parse:

```ts
  const plan = await getPlanByKind(parsed.data.kind);
  if (!plan) {
    return NextResponse.json({ error: "invalid plan" }, { status: 400 });
  }

  // Boost applies to a specific business — required.
  if (parsed.data.kind === "boost" && !parsed.data.businessId) {
    return NextResponse.json({ error: "businessId required for boost" }, { status: 400 });
  }
```

Keep the existing owner-check block for `businessId`. In the `payment_attempts` insert add `kind: plan.kind`:

```ts
    .insert({
      user_id: user.id,
      business_id: parsed.data.businessId ?? null,
      plan_days: plan.days,
      amount_agorot: plan.price,
      kind: plan.kind,
      status: "pending",
    })
```

Remove the now-unused `getPlanByDays` import.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: clean (PricingClient still sends `planDays` until Task 5 — that's a runtime 400, not a compile error; acceptable mid-plan).

- [ ] **Step 3: Commit**

```bash
git add app/api/payments/checkout/route.ts
git commit -m "feat(payments): checkout by plan kind, boost requires businessId"
```

---

### Task 4: Return route — settle boost

**Files:**
- Modify: `app/api/payments/return/route.ts`

**Interfaces:**
- Consumes: `payment_attempts.kind` from Task 1.

- [ ] **Step 1: Select `kind` and branch on settle**

Add `kind` to the attempt select:

```ts
    .select("id, user_id, business_id, plan_days, amount_agorot, status, kind")
```

Replace the success-side business update block (the `if (attempt.business_id) { ... }` after the users upsert) with:

```ts
  if (attempt.business_id) {
    const column = attempt.kind === "boost" ? "boost_expires_at" : "expires_at";
    const { data: biz } = await admin
      .from("businesses")
      .select("expires_at, boost_expires_at")
      .eq("id", attempt.business_id)
      .single();

    const current = attempt.kind === "boost" ? biz?.boost_expires_at : biz?.expires_at;
    const baseMs = current ? Math.max(Date.parse(current), Date.now()) : Date.now();
    const newExpiry = new Date(
      baseMs + attempt.plan_days * 24 * 60 * 60 * 1000
    ).toISOString();

    const { error: businessError } = await admin
      .from("businesses")
      .update({ [column]: newExpiry })
      .eq("id", attempt.business_id);
    if (businessError) {
      console.error("[/api/payments/return] failed to extend business expiry:", businessError);
    }
  }
```

Also guard the users upsert — only listing payments flip subscription:

```ts
  if (attempt.kind !== "boost") {
    const { error: userError } = await admin
      .from("users")
      .upsert({ id: attempt.user_id, subscription_status: "active" }, { onConflict: "id" });
    if (userError) {
      console.error("[/api/payments/return] failed to mark user subscription active:", userError);
    }
  }
```

- [ ] **Step 2: Verify + commit**

Run: `npx tsc --noEmit` → clean.

```bash
git add app/api/payments/return/route.ts
git commit -m "feat(payments): settle boost purchases into boost_expires_at"
```

---

### Task 5: Public pricing page — two cards

**Files:**
- Modify: `app/pricing/page.tsx` (pass plans as-is — already does)
- Rewrite: `app/pricing/PricingClient.tsx`

**Interfaces:**
- Consumes: `Plan` with `kind`; checkout body `{ kind, businessId? }` from Task 3.

- [ ] **Step 1: Rewrite `PricingClient.tsx`**

Keep: Navbar, cancel/paywall banners, auth-redirect + error-alert logic in `handleCheckout`, terms links, FAQ + contact sections, `dir="rtl"`, palette.
Replace the plan-selector grid + single CTA with two product cards. Layout: `grid md:grid-cols-2 gap-6` (stacks on mobile). Structure:

```tsx
const listing = plans.find((p) => p.kind === "listing") ?? PLANS[0];
const boost = plans.find((p) => p.kind === "boost") ?? PLANS[1];

async function handleCheckout(kind: "listing" | "boost") {
  setLoading(kind);
  try {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      router.push("/auth/register?redirectTo=/pricing");
      return;
    }
    const res = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    // ... keep existing 401 redirect + raw-text JSON-parse + alert error handling verbatim ...
    window.location.href = data.url!;
  } catch (e) {
    // keep existing catch
  }
}
```

`loading` state becomes `useState<"listing" | "boost" | null>(null)`.

Listing card (primary, green): title "רישום שנתי", price line `₪15 לשנה`, benefits = existing `BENEFITS` list, CTA `הצטרפו עכשיו • ₪15` → `handleCheckout("listing")`.
Boost card (accent, amber border + `Sparkles` icon from lucide): title "קידום חודשי", price `₪20 לחודש`, benefits: "מופיעים ראשונים בחיפוש", "תג ׳מקודם׳ בולט", "חשיפה מוגברת במפה ובעמוד הבית", note "נרכש חודש-חודש, ללא התחייבות — הקידום נרכש מלוח הבקרה לאחר יצירת העסק". Boost CTA on this public page links to `/dashboard/billing` (boost needs an existing business): `router.push("/dashboard/billing")`.
Prices always rendered from `listing.price / 100` and `boost.price / 100` — never hardcode 15/20 in logic.

- [ ] **Step 2: Verify**

Run: `npm run build`
Expected: builds clean.

- [ ] **Step 3: Commit**

```bash
git add app/pricing/PricingClient.tsx app/pricing/page.tsx
git commit -m "feat(pricing): two-card layout — yearly listing + monthly boost"
```

---

### Task 6: Boost visibility — API ordering + badge

**Files:**
- Modify: `app/api/businesses/route.ts`
- Create: `components/business/PromotedBadge.tsx`
- Modify: `components/business/BusinessCard.tsx`
- Modify: `lib/types.ts` (add `boost_expires_at?: string | null; boosted?: boolean` to the business type used by `BusinessWithSchedule`)

**Interfaces:**
- Produces: `/api/businesses` items gain `boosted: boolean`; boosted items sort first. `<PromotedBadge />` — no props, self-contained pill.

- [ ] **Step 1: API — select, flag, sort**

In `app/api/businesses/route.ts` public query: add `boost_expires_at,` to the select string (after `is_active,`). After the `.filter(isPublicReadyBusiness)` map, compute flag and sort boosted first (stable within groups):

```ts
    const nowMs = Date.now();
    const businesses = ((data ?? []) as BusinessWithSchedule[])
      .map((business) => ({
        ...business,
        boosted:
          !!business.boost_expires_at &&
          Date.parse(business.boost_expires_at) > nowMs,
        photos: ((business.photos ?? []) as Photo[])
          .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
          .slice(0, 1),
      }))
      .filter(isPublicReadyBusiness)
      .sort((a, b) => Number(b.boosted) - Number(a.boosted));
```

(`Array.prototype.sort` is stable — existing rating/recency order preserved inside each group.)

- [ ] **Step 2: `PromotedBadge.tsx`**

```tsx
import { Sparkles } from "lucide-react";

/** Small pill marking a business with an active visibility boost. */
export default function PromotedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[11px] font-bold text-amber-800">
      <Sparkles className="h-3 w-3" />
      מקודם
    </span>
  );
}
```

- [ ] **Step 3: Badge in `BusinessCard.tsx`**

Read the file; where the business name/header renders, add next to it:

```tsx
{business.boosted ? <PromotedBadge /> : null}
```

with `import PromotedBadge from "@/components/business/PromotedBadge";`. Must not break card layout at 390px width (badge wraps below name if needed — use `flex flex-wrap items-center gap-2` on the name row).

- [ ] **Step 4: Featured section in list panel**

Read `components/business/BusinessListPanel.tsx`. Where the business list maps over items, split into boosted / rest:

```tsx
const boosted = businesses.filter((b) => b.boosted);
const rest = businesses.filter((b) => !b.boosted);
```

When `boosted.length > 0`, render a section header before them:

```tsx
<p className="px-1 pt-1 pb-2 text-xs font-bold text-amber-700 flex items-center gap-1">
  <Sparkles className="h-3.5 w-3.5" />
  עסקים מקודמים
</p>
```

then the boosted cards, then (when `rest.length > 0` and boosted section shown) a plain header `כל העסקים` before the rest. When no boosted businesses, render the flat list exactly as today — no headers.

- [ ] **Step 5: Badge on business detail page**

In `app/businesses/[id]/` page (read it first), next to the business name header add the same `{boosted ? <PromotedBadge /> : null}` — compute `boosted` from `boost_expires_at` (add the column to that page's select if missing).

- [ ] **Step 6: Verify + commit**

Run: `npm run build` → clean.

```bash
git add app/api/businesses/route.ts components/business/PromotedBadge.tsx components/business/BusinessCard.tsx components/business/BusinessListPanel.tsx app/businesses lib/types.ts
git commit -m "feat(visibility): boosted-first sort, featured section, promoted badge"
```

---

### Task 7: Dashboard billing — listing + boost per business

**Files:**
- Modify: `app/dashboard/billing/page.tsx`
- Modify: `app/api/businesses/route.ts` (mine=1 select gains `boost_expires_at`)

**Interfaces:**
- Consumes: checkout `{ kind, businessId }` from Task 3.

- [ ] **Step 1: mine=1 select**

```ts
        .select("id, name, expires_at, boost_expires_at, is_active")
```

- [ ] **Step 2: Rewrite `BusinessStatusRow` + add purchase buttons**

`BusinessLite` gains `boost_expires_at: string | null`. Each row shows two status pills (listing — existing logic; boost — "מקודם עד <date>" amber pill or "לא מקודם" stone pill) and two buttons:

```tsx
async function startCheckout(kind: "listing" | "boost", businessId: string) {
  const res = await fetch("/api/payments/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, businessId }),
  });
  const raw = await res.text();
  let data: { ok?: boolean; url?: string; detail?: string } = {};
  try { data = JSON.parse(raw); } catch { /* noop */ }
  if (!res.ok || data.ok === false || !data.url) {
    alert(`שגיאה בהפניה לתשלום. נסו שוב או צרו איתנו קשר.${data.detail ? `\n\n(${data.detail})` : ""}`);
    return;
  }
  window.location.href = data.url;
}
```

Buttons per row (mobile: `flex flex-col sm:flex-row gap-2`, full-width on mobile):
- `חידוש רישום • ₪15` (green, `startCheckout("listing", b.id)`)
- boosted ? `הארכת קידום • ₪20` : `קידום העסק • ₪20` (amber, `startCheckout("boost", b.id)`)

Buttons show per-row loading state (`useState<string | null>` of `"kind:id"`), disabled while loading. Replace the generic "חידוש / הארכה → /pricing" section with a short explainer of the two products.

- [ ] **Step 3: Verify + commit**

Run: `npm run build` → clean.

```bash
git add app/dashboard/billing/page.tsx app/api/businesses/route.ts
git commit -m "feat(billing): per-business listing renewal + boost purchase"
```

---

### Task 8: Admin pricing — two fixed rows

**Files:**
- Modify: `app/api/admin/pricing/route.ts`
- Rewrite: `app/admin/pricing/PricingEditor.tsx`
- Check: `app/admin/pricing/page.tsx` (still just fetches plans + renders editor — update props if needed)

**Interfaces:**
- Produces: `POST /api/admin/pricing` body `{ plans: [{ kind, days, label, price }] }` — must contain exactly one 'listing' and one 'boost'.

- [ ] **Step 1: API validation**

```ts
const planSchema = z.object({
  kind:  z.enum(["listing", "boost"]),
  days:  z.number().int().positive(),
  label: z.string().min(1).max(100),
  price: z.number().int().positive(),
});

const pricingSchema = z.object({
  plans: z.array(planSchema).length(2),
}).refine(
  (v) =>
    v.plans.some((p) => p.kind === "listing") &&
    v.plans.some((p) => p.kind === "boost"),
  { message: "נדרשת בדיוק תוכנית רישום אחת ותוכנית קידום אחת" }
);
```

Remove the ascending-price loop (no ladder anymore). Insert rows include `kind`:

```ts
  const rows = plans.map((p, i) => ({ sort_order: i, kind: p.kind, days: p.days, label: p.label, price: p.price }));
```

- [ ] **Step 2: Rewrite editor**

Two fixed cards (not an editable table): "רישום שנתי" and "קידום חודשי". Each card: label input, days input, price input (₪, stored ×100). No add/remove rows. Kind shown as a static header per card, sent along on save. Keep save button + saved/saving states + admin palette. Mobile: cards stack (`grid md:grid-cols-2 gap-4`).

- [ ] **Step 3: Verify + commit**

Run: `npm run build` → clean.

```bash
git add app/api/admin/pricing/route.ts app/admin/pricing/PricingEditor.tsx app/admin/pricing/page.tsx
git commit -m "feat(admin): pricing editor locked to listing + boost products"
```

---

### Task 9: Admin boosts page + API

**Files:**
- Create: `app/api/admin/boosts/route.ts`
- Create: `app/admin/boosts/page.tsx`
- Modify: `app/admin/layout.tsx` (nav)

**Interfaces:**
- Produces:
  - `GET /api/admin/boosts` → `{ businesses: [{ id, name, boost_expires_at, is_active }], revenueAgorot: number }` (revenue = sum of succeeded boost attempts in current calendar month)
  - `POST /api/admin/boosts` body `{ businessId: uuid, action: 'grant' | 'revoke' }` — grant = extend `boost_expires_at` from `max(now, current)` +30d; revoke = set null.

- [ ] **Step 1: API route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-session";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = adminClient();

  const { data: businesses, error } = await db
    .from("businesses")
    .select("id, name, boost_expires_at, is_active")
    .order("boost_expires_at", { ascending: false, nullsFirst: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { data: payments, error: payErr } = await db
    .from("payment_attempts")
    .select("amount_agorot")
    .eq("status", "succeeded")
    .eq("kind", "boost")
    .gte("completed_at", monthStart.toISOString());
  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 });

  const revenueAgorot = (payments ?? []).reduce((sum, p) => sum + p.amount_agorot, 0);
  return NextResponse.json({ businesses: businesses ?? [], revenueAgorot });
}

const actionSchema = z.object({
  businessId: z.string().uuid(),
  action: z.enum(["grant", "revoke"]),
});

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = actionSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const db = adminClient();
  const { businessId, action } = parsed.data;

  if (action === "revoke") {
    const { error } = await db
      .from("businesses")
      .update({ boost_expires_at: null })
      .eq("id", businessId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // grant: extend from max(now, current) + 30 days.
  const { data: biz, error: readErr } = await db
    .from("businesses")
    .select("boost_expires_at")
    .eq("id", businessId)
    .single();
  if (readErr || !biz) return NextResponse.json({ error: "business not found" }, { status: 404 });

  const baseMs = biz.boost_expires_at
    ? Math.max(Date.parse(biz.boost_expires_at), Date.now())
    : Date.now();
  const newExpiry = new Date(baseMs + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await db
    .from("businesses")
    .update({ boost_expires_at: newExpiry })
    .eq("id", businessId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, boost_expires_at: newExpiry });
}
```

- [ ] **Step 2: Page**

Client component. Header cards: active boosts count, `₪{revenueAgorot/100}` this-month boost revenue. Table (mobile: card list, `md:` table) of businesses: name, boost state pill (active until date / none), actions: "הענק 30 יום" (grant) / "בטל קידום" (revoke, `confirm()` first). Refetch after action. Follow admin palette + `dir="rtl"` + patterns from `app/admin/coupons/page.tsx` (read it for table/list idioms).

- [ ] **Step 3: Nav item**

`app/admin/layout.tsx` NAV, after pricing:

```ts
  { href: "/admin/boosts", label: "קידומים", icon: Sparkles },
```

with `Sparkles` added to the lucide import.

- [ ] **Step 4: Verify + commit**

Run: `npm run build` → clean.

```bash
git add app/api/admin/boosts/route.ts app/admin/boosts/page.tsx app/admin/layout.tsx
git commit -m "feat(admin): boosts management page — grant/revoke + revenue"
```

---

### Task 10: Admin home — richer dashboard

**Files:**
- Modify: `app/admin/page.tsx`

**Interfaces:**
- Consumes: `payment_attempts.kind`, `businesses.boost_expires_at`.

- [ ] **Step 1: Extend queries + cards**

Add to the `Promise.all`:

```ts
    supabase
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .gt("boost_expires_at", new Date().toISOString()),
```

Plus (service metrics need admin client — page runs server-side behind admin middleware; use `adminClient()` from `@/lib/supabase/admin` for payments since RLS blocks anon):

```ts
  const admin = adminClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const [{ data: monthPayments }, { data: recent }] = await Promise.all([
    admin
      .from("payment_attempts")
      .select("amount_agorot, kind")
      .eq("status", "succeeded")
      .gte("completed_at", monthStart.toISOString()),
    admin
      .from("payment_attempts")
      .select("id, amount_agorot, kind, status, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);
  const revenueMonth = (monthPayments ?? []).reduce((s, p) => s + p.amount_agorot, 0);
```

New cards appended: "עסקים מקודמים" (Sparkles, amber), "הכנסות החודש" (`₪{revenueMonth/100}`, Banknote icon). Below the card grid: "תשלומים אחרונים" list — each row: kind label (`רישום` / `קידום`), `₪amount`, status pill (succeeded green / pending stone / failed red / refunded amber), date `toLocaleDateString("he-IL")`. Mobile: cards `grid-cols-2`, list rows wrap.

- [ ] **Step 2: Verify + commit**

Run: `npm run build` → clean.

```bash
git add app/admin/page.tsx
git commit -m "feat(admin): home dashboard — boosts, monthly revenue, recent payments"
```

---

### Task 11: Playwright smoke + mobile spec

**Files:**
- Create: `tests/pricing-v2.spec.ts`

- [ ] **Step 1: Write spec**

Read `playwright.config.ts` + an existing spec in `tests/` first for baseURL/setup idioms, then:

```ts
import { test, expect } from "@playwright/test";

const MOBILE = { width: 390, height: 844 };

test.describe("pricing v2", () => {
  test("pricing page shows both products (desktop)", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByText("רישום שנתי").first()).toBeVisible();
    await expect(page.getByText("קידום חודשי").first()).toBeVisible();
    await expect(page.getByText("₪15").first()).toBeVisible();
    await expect(page.getByText("₪20").first()).toBeVisible();
  });

  test("pricing page mobile — stacked, no horizontal overflow", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/pricing");
    await expect(page.getByText("רישום שנתי").first()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  });

  test("checkout API rejects boost without businessId", async ({ request }) => {
    const res = await request.post("/api/payments/checkout", {
      data: { kind: "boost" },
    });
    // 401 unauthenticated or 400 validation — never 500.
    expect([400, 401]).toContain(res.status());
  });

  test("homepage loads with boosted-first list (mobile)", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  });
});
```

- [ ] **Step 2: Run**

Run: `npx playwright test tests/pricing-v2.spec.ts`
Expected: all pass (requires dev server per playwright.config webServer setting).

- [ ] **Step 3: Commit**

```bash
git add tests/pricing-v2.spec.ts
git commit -m "test: pricing v2 smoke — desktop + mobile viewport"
```

---

### Task 12: Full verification loop

- [ ] **Step 1: Static gates**

Run: `npx tsc --noEmit && npm run lint && npm run build` → all clean.

- [ ] **Step 2: Full Playwright suite**

Run: `npx playwright test` → no new failures vs. pre-change baseline.

- [ ] **Step 3: /loop browser verify (mobile-first)**

Iterative verify cycle with browser tooling at 390×844 and desktop:
1. `/pricing` — two cards render, listing CTA reaches auth redirect or HYP URL creation, boost CTA routes to dashboard billing.
2. `/dashboard/billing` — rows show both statuses, both buttons produce checkout URL (stop before HYP payment).
3. `/` map list — boosted business (grant one via admin) appears first with badge.
4. `/admin` home, `/admin/pricing`, `/admin/boosts` — cards/data render, grant + revoke round-trip works, price edit persists.
5. Fix any finding, re-run failed check, repeat until clean pass.

- [ ] **Step 4: Final commit if fixes were made**

```bash
git add -A && git commit -m "fix: pricing v2 verify-loop fixes"
```
