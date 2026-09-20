# Meta Ads G0 Verification Record

**Status:** HOLD — G0 not passed  
**Attempted:** 2026-08-03 UTC  
**Operator:** Pulse  
**Authority:** Read-only inspection only. No campaign, audience, billing, account-setting, publication, or spend change is authorized.

## Wake acknowledgment and evidence boundary

- Daniel confirmed that Meta access exists. This is recorded as an access-availability attestation, not as configuration evidence or launch approval.
- Pulse opened `https://business.facebook.com/settings` from the controlled browser probe. Meta redirected the session to the public Business login page.
- The run has no Chrome user profile, saved browser auth profile, Meta connector, or granted Meta secret. An authenticated account surface was therefore not inspectable in this heartbeat.
- No login credentials were requested or exposed. No state-changing control was opened or used.
- Repository evidence still supports only “browser Pixel code-ready, account/production QA pending”; it cannot prove Meta-side ownership or settings.

## Account-side G0 matrix

| Required check | Status | Evidence / next read-only check |
|---|---|---|
| Exact Business Portfolio name, ID, owner, status | Not verified | Read Business Info in authenticated Business Settings |
| Exact ad account name, ID, owner, delivery/restriction status | Not verified | Read Accounts > Ad accounts and Account Quality |
| Exact Facebook Page name, ID, ownership/portfolio assignment | Not verified | Read Accounts > Pages |
| Exact Instagram handle/ID, professional status, ownership and Page link | Not verified | Read Accounts > Instagram accounts and Page connection |
| Exact Pixel/dataset name, ID, owner, ad-account/domain connection, diagnostics | Not verified | Read Data Sources / Events Manager; do not change sharing settings |
| `pokarov.co.il` domain owner and verification status | Not verified | Read Brand Safety > Domains or current equivalent |
| Pulse/user/partner role scope across all assets | Not verified | Read People/Partners/System Users; confirm campaign/read only and no finance/user-admin rights |
| Portfolio 2FA requirement and compliance | Not verified | Read Security Center without changing enforcement |
| Ad-account currency and timezone | Not verified | Read ad-account Business Info; required result is ILS and Asia/Jerusalem |
| Billing visibility and payment-method presence | Not verified | Read Billing & payments without copying sensitive payment data |
| Account spending limit, remaining amount, campaign caps/rules, and limit-change authority | Not verified | Read Payment settings and automated rules; do not create or edit controls |

## Gate decision

**G0 result: HOLD.** The exact Meta assets and controls are not yet verified. Campaign creation, billing changes, publication, and spend remain prohibited. G1/G2 cannot be requested until this matrix and the production consent/Test Events checks are completed and approved by the named owners.

## Unblock requirement

Daniel or the access owner must complete only the human authentication/2FA handoff: connect an authenticated Meta Business session that Pulse can inspect read-only, or provide a redacted export/screenshot set covering every matrix row. Pulse will perform the inventory, reconcile IDs and ownership, record pass/fail evidence, and stop on any mismatch. Personal names, recovery details, card data, and payment identifiers must be redacted.

A structured question card on this issue captures which evidence path will be made available and will wake Pulse to continue.