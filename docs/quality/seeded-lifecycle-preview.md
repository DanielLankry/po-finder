# DAN-113 Seeded Lifecycle Preview

This suite joins the DAN-111 shared owner lifecycle UI with the DAN-112 fixture contract in one disposable customer/owner journey. It creates only `qa+*@pokarov.test` identities and removes users, business rows, child content, and the uploaded private photo after the run.

## Covered journey

- Pricing selection routes to registration with `business_owner` and the selected plan preserved; the test stops before signup so it sends no email.
- Five public fixtures cover a signed private-bucket photo, no photo, open hours, unknown hours, confirmed closed, an event, a customer review, contact actions, and private business-number exclusion.
- Customer discovery runs at 320, 390, and 430 px. Confirmed-closed businesses are absent from map/list discovery while unknown hours remain discoverable.
- The owner draft moves through pending verification, verified/inactive, payment processing, settled/public, expired/private, and failed-payment recovery states.
- Settlement uses `settle_payment_attempt` with `provider_called: false`; the suite never opens HYP checkout or a payment-return URL.
- Public API assertions exclude `owner_id`, `business_number`, and promoted placement. The signed-in owner public request still excludes the expired listing.

## Safety gates

Run only after an operator confirms both the app URL and Supabase project are disposable. The shared destructive guard rejects the production project ref and `pokarov.co.il` hosts. This suite adds a second, explicit preview-fixture confirmation.

```bash
PLAYWRIGHT_BASE_URL="$APPROVED_DISPOSABLE_BASE_URL" \
RUN_DESTRUCTIVE=1 \
PREVIEW_FIXTURES_CONFIRMED=1 \
npx playwright test tests/destructive/seeded-lifecycle-preview.spec.ts \
  --project=chromium-desktop
```

Do not run this command against production, do not substitute real customer addresses, and do not use a real card. No migration, deployment, secret change, or provider call is part of this suite.

The non-destructive structural check can run anywhere:

```bash
node --test tests/seeded-lifecycle-preview-contract.test.mjs
```
