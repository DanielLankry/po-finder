# Security and payment email rollout — 2026-09-09

## Account security: live and verified

Supabase password-changed and email-address-changed notifications are enabled. These and the change-email confirmation now use the shared Hebrew paper/green/terracotta email renderer. Signup confirmation and recovery retain the existing verified templates and links.

A disposable customer account completed a password change and a secure email change with both confirmation links. Resend reported `delivered` for all four emails, with Hebrew subjects, branded HTML and no unexpanded variables. The final change notice went to the original address. The test account was signed out and deleted; no existing customer credentials changed.

Sources: `scripts/build-security-email-templates.mjs` and `supabase/templates/{password-changed,email-address-changed,change-email-address}.html`. Rebuild with `node scripts/build-security-email-templates.mjs`; hosted Supabase settings are managed separately.

## Payment events and delivery

The private trigger enqueues only future `pending → succeeded` listing payments and `succeeded → refunded` refunds. The outbox entry commits with the saved entitlement; callbacks and refund routes call the worker through Next.js `after`. Failed/uncertain payment verification and failed entitlement writes never schedule a success message. Existing HYP receipt sending remains unchanged.

Each message snapshots the buyer address, charged amount, duration, business name, resulting publication state and expiry. A pre-profile purchase explains the remaining profile/approval steps. Renewals and refunds use the actual saved expiry, including exact day plans and calendar-month rollbacks.

`payment_email_outbox` has RLS and no browser grants. Only signed admin routes expose its bounded audit fields. The claim RPC is service-role-only, uses `SKIP LOCKED` and a two-minute lease. The first rendered request is saved before sending; every retry uses identical content and a stable Resend idempotency key.

Timeouts or missing acceptance acknowledgements are uncertain. Automatic retries stop after 23 hours of uncertainty, before Resend's 24-hour key retention ends. Explicit rate-limit rejections can retry later if no earlier send is uncertain. Six unsuccessful attempts or terminal failures require attention. The admin page deliberately distinguishes provider acceptance from inbox delivery; inbox/bounce investigation remains in Resend.

First attempts run after the payment response. The Vercel Hobby-compatible fallback cron runs daily at `0 7 * * *` UTC and processes up to five due messages per run. Administrators can process another due batch from `/admin/payment-emails`; this does not force-send ambiguous or terminal messages. No paid scheduler was added. A prolonged outage or larger backlog may require multiple admin batches; uncertain sends older than 23 hours require provider reconciliation before any manual resend.

## Hosted Resend templates

All six earlier business/contact/expiry templates remain published. Three more published templates mirror `scripts/payment-email-catalog.mjs`:

| Alias | Template ID |
| --- | --- |
| payment-succeeded | 01f6e80f-2ffa-4b21-93d7-9824c7d7999f |
| listing-renewed | 75d8bb7a-3f80-4ae7-b0ac-8994f092faeb |
| payment-refunded | 6c66dcf6-8e19-49bc-83e2-8f265dbc8ede |

Runtime sends the immutable HTML stored in the outbox. Editing a hosted template alone does not change runtime messages. The seven hosted variables are BUSINESS_NAME, AMOUNT, DURATION, EXPIRY_DATE, EVENT_DATE, REFERENCE and LISTING_STATUS. Three clearly labelled design/delivery test messages reached Resend `delivered`; these were not financial transactions.

## Deployment and verification

Production migration `20260909122231_payment_email_outbox.sql` is applied. Preserve that exact version in migration history. Verification found an empty outbox, the installed trigger, no anonymous/customer table access, no customer claim-RPC access, and service-role update access. Advisor differences consist only of the intentional RLS-without-public-policies informational notice for the private queue.

The application branch includes production's email-verification/theme changes from `457d18e`, along with the previous business-registration/admin-approval fixes. Keep these when deploying this feature.

Validation: 24 focused Node/PostgreSQL tests plus 13 related auth/email/payment regressions; lint and production build; 12 desktop/mobile admin UI scenarios. PostgreSQL settlement/refund functions execute in an in-memory PGlite database. Browser fixtures intercept all network traffic; no local server or production QA business/payment rows are used.

Live smoke checks must verify `/api/admin/payment-emails` returns 401 without admin auth, `/api/cron/payment-emails` returns 401 without its token, and a signed admin can load the queue. Actual charged-card settlement/refund was not exercised in production.

Existing dependency debt: the September 9 npm production audit reports nine findings, including a critical Next.js advisory. The affected runtime versions and override pins were already present; this email change only adds PGlite as a development test dependency. Updating those runtime dependencies requires a separate compatibility/security pass. Existing Supabase leaked-password protection remains disabled; that setting was not part of this rollout.
