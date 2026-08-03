# Po Finder Meta G0 access and asset verification

**Issue:** DAN-104, child of DAN-10

**Operator:** Pulse

**Checked:** 2026-08-03 (UTC)

**Scope:** Read-only G0 verification. No campaign, billing, audience, role, asset,
or publishing changes were made.

## Verdict

**NOT READY — G0 has not passed.**

The application contains a consent-aware Meta Pixel implementation that names
dataset/Pixel ID `27527545196939763`, and the production site and privacy notice
are reachable. However, this execution context has no authenticated Meta
session or Meta connector. Ads Manager redirects to the Meta business login
flow and Events Manager redirects through a permission error to the same login
flow. Therefore the Business Portfolio, asset ownership, current roles, 2FA
enforcement, ad-account configuration, billing boundary, spending-limit
capability, and live event diagnostics could not be truthfully verified.

Daniel's confirmation that access exists is useful owner testimony, but it is
not sufficient evidence for G0. Do not create or publish a campaign and do not
spend until the owner-assisted read-only pass below is completed and recorded.

## Evidence collected

| Check | Result | Evidence and limit |
|---|---|---|
| Production site | Verified | `https://pokarov.co.il/` returned HTTP 200 on 2026-08-03. |
| Privacy disclosure | Verified | The production privacy page names Meta and cookie-based tracking. This verifies disclosure text, not event receipt or account ownership. |
| Repository Pixel ID | Verified in code | `lib/meta-pixel.ts` uses `NEXT_PUBLIC_META_PIXEL_ID` with fallback `27527545196939763`. The ID is a safe asset identifier; no credential was recorded. |
| Consent-aware Pixel implementation | Verified in code | Pixel library initialization and PageView/event dispatch require `po-cookie-consent=accepted`; decline revokes consent and removes accessible `_fbp`/`_fbc` cookies. |
| Production browser request behavior | Not runtime-verified | The available Playwright browser could not start because the image lacks required Chromium system libraries. Code inspection is not a substitute for a production network trace. |
| Ads Manager access | Failed / unauthenticated | `https://business.facebook.com/adsmanager/manage/campaigns` redirected to `/business/loginpage/`. |
| Events Manager access | Failed / unauthenticated | `https://business.facebook.com/events_manager2/list/pixel` redirected through `/user_permission_errors` to `/business/loginpage/`. |
| Public Facebook Page | Not evidenced | A public web search for Po Finder / `פה קרוב` / `pokarov.co.il` did not surface a canonical Page. Search absence is not proof that no Page exists. |
| Public Instagram account | Not evidenced | A public web search did not surface a canonical professional account. Search absence is not proof that no account exists. |
| Public domain-verification marker | Not evidenced | The homepage contained no `meta-domain-verification` tag and the apex TXT response exposed Google verification and SPF records, not a current Facebook verification token. Meta may retain verification after a token is removed, so Business Settings remains authoritative. |

No password, session cookie, access token, payment detail, personal identity,
or recovery material was accessed or recorded.

## Required asset and control inventory

| Required G0 item | Status | Pass condition |
|---|---|---|
| Business Portfolio display name and Business ID | **Unverified** | Correct Po Finder portfolio is visible and its non-secret ID is recorded. |
| Ad account name and `act_…` ID | **Unverified** | Correct owned/assigned account is visible and its ID is recorded. |
| Facebook Page name, URL, Page ID, owner | **Unverified** | Correct Page is assigned to the expected portfolio and operator. |
| Instagram professional account and ID, or confirmed absence | **Unverified** | Linked account and owner are verified, or the owner explicitly records that none exists. |
| Pixel/dataset ID and owner | **Partial** | ID `27527545196939763` is referenced by code; Events Manager must show that exact dataset owned by the expected portfolio and connected to the ad account. |
| Verified domain | **Unverified** | Business Settings shows `pokarov.co.il` verified and owned by the expected portfolio. |
| Pulse role | **Unverified** | Pulse has only partial asset access and ad-account Advertiser / manage-campaign access needed for approved work. |
| No finance/admin authority | **Unverified** | Pulse cannot manage people, partners, finance, payment methods, ownership, security, or account closure. |
| 2FA enforcement | **Unverified** | Portfolio requires 2FA for everyone; the owner confirms at least two trusted human recovery admins. |
| Currency and timezone | **Unverified** | Ad account is ILS and Asia/Jerusalem. A mismatch is a launch blocker because these fields are difficult or impossible to change later. |
| Billing visibility boundary | **Unverified** | Budget owner can view/manage billing; Pulse cannot view payment details or change billing. |
| Account spending limit | **Unverified** | Owner confirms a 300 ILS account spending limit can be applied for the first test, or approves an equivalent first-class cap before launch. No limit was set during this review. |
| Ads Manager / Events Manager UI | **Failed in this runtime** | A delegated, authenticated session opens both tools and only the assigned assets. |
| Live PageView and standard-event receipt | **Unverified** | Events Manager Test Events/diagnostics receives consented production events for the expected dataset with no material diagnostic error. |

## Gap list and disposition

### G0 blockers

1. **No delegated authenticated Meta session or read-only export is available to
   Pulse in this run.** Owner: Daniel. Provide a supervised/authenticated
   browser session that does not expose credentials, or attach redacted
   screenshots/exported views covering the inventory table below.
2. **Portfolio and asset ownership are unverified.** Owner: Daniel. Confirm the
   Portfolio, Page, Instagram account or explicit absence, ad account, dataset,
   and domain in Business Settings.
3. **Least privilege and 2FA are unverified.** Owner: Daniel. Show People/asset
   assignment and Security Center views proving partial advertiser access, no
   finance/admin authority, and required 2FA.
4. **Ad-account safety controls are unverified.** Owner: Daniel. Show currency,
   timezone, billing-role boundary, and account-spending-limit availability.
5. **Pixel ownership and live delivery are unverified.** Owner: Daniel with
   Pulse observing. Open Events Manager for dataset `27527545196939763` and
   verify ownership, ad-account connection, diagnostics, and consented Test
   Events.

### Non-blocking observations

- The source implementation is materially stronger than the stale raw-pixel
  instructions in `TRACKING-SETUP.md`: it gates Meta network activity on
  optional-cookie consent and avoids the raw `noscript` image.
- Public search did not identify a canonical Facebook or Instagram identity.
  This is a discoverability concern after the owner confirms the actual assets;
  it is not evidence of absence.
- The production Pixel ID should be explicitly configured in the deployment
  rather than relying on the code fallback; confirm this without exposing the
  environment value beyond the safe numeric ID.

## Owner-assisted read-only completion sheet

The owner can provide this evidence without sharing credentials, cookies,
tokens, payment details, recovery codes, or personal data. Redact operator
names/emails except the role being checked.

| View | Record only |
|---|---|
| Business Settings → Business info | Portfolio display name and Business ID |
| Business Settings → Accounts → Pages | Page name, URL, Page ID, owner/assignment |
| Business Settings → Accounts → Instagram accounts | Handle, account ID, owner/assignment, or explicit “none” |
| Business Settings → Accounts → Ad accounts | Account name, `act_…` ID, owner, currency, timezone |
| Business Settings → Data sources → Datasets/Pixels | Dataset ID, owner, connected ad account |
| Business Settings → Brand safety → Domains | `pokarov.co.il` status and owner |
| Business Settings → People / Partners | Pulse's asset-scoped role only; redact unrelated people |
| Security Center | “Require 2FA for everyone” status; no recovery codes or personal details |
| Ads Manager → Billing/Payment settings | Role boundary and account-spending-limit capability only; redact all payment instruments and invoices |
| Events Manager → Overview / Test Events / Diagnostics | Correct dataset, recent event receipt, diagnostic state; redact user/event parameters |

## Exit criteria

G0 passes only when every required item is marked verified, Pulse's role is
least-privilege advertiser with no finance/admin authority, the account is ILS
and Asia/Jerusalem, a first-class 300 ILS test-window cap is available, and
Events Manager receives the expected consented events for dataset
`27527545196939763`. Until then the launch decision remains **hold / no spend**.
