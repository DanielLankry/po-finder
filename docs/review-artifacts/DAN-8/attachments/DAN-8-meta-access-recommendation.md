# Po Finder Meta access recommendation

Prepared for DAN-8 on 2026-07-28. This is an access and governance
recommendation; it does not request or contain a password, session cookie,
access token, app secret, payment detail, recovery code, or other credential.

## Decision

Use **Meta Business Portfolio native delegation** as the default access path:

1. Daniel remains the primary human with full control and asset ownership.
2. Daniel invites a named, authentic operator identity and assigns only the
   required assets with partial/task access.
3. Page and Instagram work uses Meta Business Suite; advertising work uses Ads
   Manager.
4. Do not give Pulse full-control, finance, payment-method, user-management, or
   ownership-transfer permissions.
5. Do not create an API app, system user, or token until there is a concrete,
   approved automation requirement that first-party tools cannot satisfy.

If Paperclip later has its own verified Meta Business Portfolio and multiple
people need the same operational boundary, Daniel can grant **partner access**
to that portfolio instead of repeatedly assigning individuals. Validate the
Business ID out of band before accepting or sending a partner request. Meta
warns that malicious partner requests can carry phishing links even when the
notification originates from a legitimate Meta mail domain.

This path is safer than password sharing, browser-session reuse, or a pasted
long-lived token: it is supported by Meta, attributable to a named identity,
asset-scoped, visible in Business Settings, and revocable without changing
Daniel's login.

## What is known and what Daniel must inventory

The repository confirms the following technical asset:

| Asset | Known identifier | Current use | Required access |
|---|---|---|---|
| Meta Pixel / dataset | `27527545196939763` | Consent-aware PageView and standard conversion events | View events/diagnostics only for routine operations; manage only for a separately approved tracking change |

The repository does not expose, and should not be used to guess, the Business
Portfolio ID, Page ID, Instagram account ID, ad account ID, Meta app ID, domain
verification owner, or asset owners. Daniel should record the following
non-secret inventory from **Business Settings > Business assets** in the issue
or an access register:

| Required record | Why |
|---|---|
| Business Portfolio display name and Business ID | Defines the ownership and delegation boundary |
| Primary owner and at least one human recovery admin | Prevents a single-person lockout |
| Facebook Page name, URL, Page ID, and owning portfolio | Required identity for Page posts and ads |
| Instagram professional account handle and ID, or “not present” | Required for Instagram placements/publishing; it should be linked to the Page |
| Ad account name, `act_…` ID, owner, currency, and timezone | Prevents operating in or billing the wrong account |
| Pixel/dataset ID and owner | Confirm `27527545196939763` is owned by the expected portfolio and connected to the expected ad account |
| Verified domain and verification owner | Confirm `pokarov.co.il` is controlled by the expected portfolio |
| Facebook/Instagram identity used by each active operator | Enables attribution, offboarding, and access review |
| Any Meta app/system user/business integration | Finds persistent automation paths that survive a human UI session |

Asset IDs are identifiers, not credentials. They may be recorded. Tokens,
secrets, passwords, session cookies, recovery codes, and payment details may
not.

## Least-privilege permission matrix

Start with the smallest row that satisfies the approved work. Expand only for a
specific task, then remove the expansion.

| Asset | Routine Pulse role | Allowed | Withhold / Daniel only |
|---|---|---|---|
| Business Portfolio | Partial access to explicitly assigned assets | Open assigned tools and assets | Full control, people/partner management, security settings, ownership changes |
| Facebook Page | Task access: Content, Messages and community activity, Ads, Insights | Publish/schedule content, respond/moderate, use Page identity in ads, view performance | Facebook access with full control, Page settings, linked-account changes, access management, deletion |
| Instagram professional account, if present | Equivalent task permissions for Content, Messages/community, Ads, Insights | Publish/schedule, respond/moderate, use identity in ads, view performance | Account ownership, credential/reset changes, unlinking, full control |
| Ad account | Advertiser / Manage campaigns | Create/edit/pause campaigns, ads and audiences; view reports; spend only inside an approved budget | Ad-account admin, user management, payment methods, credit line, account closure, finance |
| Ad account for reporting-only work | Analyst / View performance | Read ads and reports | Campaign mutation and all admin/finance actions |
| Pixel/dataset `27527545196939763` | View events/diagnostics | Verify receipt, deduplication, and diagnostics | Change connections/settings, delete data source, create tokens |
| Verified domain `pokarov.co.il` | View if needed | Confirm ownership/status | Change verification or ownership |
| Meta app/system user | None in phase 1 | None | App administration, app secret, token generation, system-user administration |

Meta documents that Page task access works through Business Suite, Ads Manager,
and other business tools without allowing the person to switch into and manage
the Page on Facebook. It also warns that Page full control permits the recipient
to change access, remove the owner, or delete the Page. For an ad account not in
a portfolio, Meta's legacy roles are Analyst, Advertiser, and Admin; Admin also
controls payment methods and permissions, so it is not appropriate here.

## Access-method comparison

| Method | Security and maintenance | Fit for Po Finder | Decision |
|---|---|---|---|
| Meta Business Suite + Ads Manager with named partial/task access | First-party, no shared credential, strong UI auditability, instant revocation, supports 2FA | Covers current Page, Instagram, campaign, and reporting operations | **Use now** |
| Partner access to a separate verified Business Portfolio | First-party organization-to-organization boundary; central offboarding; requires a real partner portfolio and careful Business ID verification | Good when Paperclip has a governed Meta portfolio and multiple operators | **Use later if the organizational boundary exists** |
| Maintained third-party business integration via Meta Login/OAuth | Vendor receives consented scopes; revocable in Business Integrations, but the vendor may create additional portfolio integrations and has its own retention/security risk | No approved or installed Meta connector is available in the current Paperclip toolset | **Do not add solely to solve access** |
| Direct Graph, Pages, Instagram, and Marketing APIs using a Po Finder-owned Meta app and system user | Most automatable; largest secret, review, monitoring, versioning, and incident-response burden | Appropriate only for a stable server-side workflow that first-party tools cannot perform | **Defer pending an automation design and security review** |
| Shared personal login, password, session cookie, remote browser profile, or token pasted into chat/config | Poor attribution, broad blast radius, difficult recovery, and contrary to Meta's guidance against account sharing | Unnecessary and unsafe | **Prohibited** |

## If direct API access is later approved

Create the Meta app inside Daniel's/Po Finder's Business Portfolio, not inside
an operator's personal or vendor-owned portfolio. Use a non-admin system user,
assign only the necessary assets, generate the narrowest token, and call Meta
only from a server-side service.

Minimum scopes depend on the approved workflow:

| Workflow | Candidate permissions; confirm against the current endpoint docs during implementation |
|---|---|
| Read ad reporting | `ads_read`; add `business_management` only when portfolio asset discovery/management truly requires it |
| Create or edit campaigns | `ads_management`; avoid `ads_read` unless a separate read/reporting need requires it |
| Discover Pages available to the app | `pages_show_list` |
| Read Page engagement | `pages_read_engagement` / the current documented read-engagement permission |
| Publish Page posts | `pages_manage_posts`, plus the Page permissions required by the current Pages API guide |
| Moderate Page engagement | `pages_manage_engagement` only for an approved moderation workflow |
| Instagram identity lookup | `instagram_basic` and `pages_show_list` for the Facebook Login path |
| Publish Instagram content | `instagram_content_publish` |
| Manage Instagram comments or messages | `instagram_manage_comments` or `instagram_manage_messages`, separately and only if required |

Implementation controls:

- Use the current supported, explicitly pinned Graph API version and schedule a
  version review before Meta's upgrade deadline.
- Complete Business Verification, App Review, and Full/Advanced Access only
  when the app's ownership and use case require them. Meta says managing only
  your own ad account can use the default access to `ads_read`/`ads_management`,
  while managing other people's ad accounts requires advanced/full access.
- Store app secrets and tokens only in the approved server-side secret manager.
  Never put them in source, client JavaScript, logs, issue comments, documents,
  shell history, screenshots, or chat.
- Prefer a token with a finite lifetime. If Meta's system-user flow offers a
  non-expiring-by-time token, treat it as a high-impact standing credential:
  owner-approved, asset-scoped, rotated at least every 90 days, and revoked on
  offboarding, scope reduction, suspected exposure, app/owner change, or failed
  quarterly review.
- Record token metadata only: secret-store reference, app ID, system-user ID,
  scopes, assets, issuer, creation/rotation/expiry dates, and owner.
- Validate token identity/scopes with Meta's server-side debugging facilities
  without printing the token. Monitor authentication failures, permission
  changes, unusual spend, and API error rates.
- Build a kill switch: revoke the token, remove the system user from assets,
  disable the integration, and pause campaigns without needing the operator.

Meta's access-token guide says short-lived tokens typically last one to two
hours and long-lived tokens about 60 days, but lifetimes can change and tokens
can expire early. It also says system-user/Marketing API tokens may not expire
based on time while remaining subject to other invalidation. Operational
rotation is therefore required even when Meta does not enforce expiry.

## Ownership, 2FA, recovery, and audit baseline

- Daniel retains full control, payment/finance control, asset ownership, domain
  verification control, app ownership, and final approval for spend and
  destructive changes.
- Maintain a second trusted **human** recovery admin with full control. It must
  not be Pulse, a bot, a shared identity, or a contractor account.
- Require 2FA for everyone with portfolio access. Prefer two registered FIDO2
  security keys (primary and backup); an authenticator app is the fallback.
  Store one-time recovery codes offline under Daniel's control.
- Every operator uses their own authentic account. Never share a Facebook or
  Instagram login.
- Turn on login alerts and business-change notifications. Review recognized
  devices/sessions and remove stale sessions.
- Review People, Partners, System Users, Apps, Business Integrations, asset
  assignments, and finance roles monthly for the first 90 days and quarterly
  thereafter.
- Review ad spend and account history weekly while campaigns are active. Set
  account/campaign budgets and alerts; Daniel remains the escalation owner for
  unexpected spend.
- Keep an access register containing grantor, recipient, asset, role, business
  reason, grant date, review date, and removal date. Do not place secrets in it.
- Perform an offboarding drill once: remove the operator, verify Suite/Ads
  Manager access is gone, revoke integrations/tokens if any, and retain the
  audit record.

## Daniel vs. Pulse responsibilities

| Step | Daniel / human asset owner | Pulse / agent |
|---|---|---|
| Authenticate to Meta and pass 2FA/identity checks | Required | Never receives credentials or codes |
| Verify the canonical Portfolio, Page, Instagram, ad account, pixel, and domain | Owns final confirmation | Supplies the inventory template and checks non-secret IDs for consistency |
| Invite a person/partner and assign/revoke assets | Required because it changes external access | Recommends the exact task roles; verifies access after Daniel completes the UI step |
| Add/change payment method, finance role, ownership, or recovery admin | Required; Daniel-only decision | No access |
| Create/approve campaigns and spend | Sets budget and approval boundary | Operates campaigns only after assigned access and explicit budget/creative approval |
| Create Meta app/system user/token | Required owner action after separate approval | May implement the server integration without viewing or transmitting the secret |
| Store/rotate/revoke a token | Authorizes and owns lifecycle | Uses only an injected secret reference; validates behavior without exposing its value |
| Audit and offboard | Accountable owner | Produces review checklist/evidence and flags stale or excessive access |

## Step-by-step onboarding checklist

1. Daniel signs in by typing the Meta URL directly, completes Security Checkup,
   enables 2FA, registers a backup method, downloads recovery codes to offline
   storage, and enables login/business-change alerts.
2. Daniel confirms a second trusted human recovery admin. Remove unknown or
   former People, Partners, System Users, Apps, and Business Integrations.
3. Daniel opens Business Settings and completes the non-secret asset inventory
   above. Confirm the Page, Instagram professional account (if present), ad
   account, pixel `27527545196939763`, and `pokarov.co.il` are owned by the
   intended portfolio. Stop and resolve ownership discrepancies before access.
4. Daniel chooses named-person partial access. Use partner access only if
   Paperclip has an approved, verified Business Portfolio; verify its Business
   ID through a separate known channel.
5. Daniel assigns Page task access for Content, Messages/community, Ads, and
   Insights; the Instagram equivalents if present; Ad account Advertiser; and
   pixel/dataset view access. Do not enable full control, finance, or people
   management.
6. The operator accepts the invite through Meta, enables their own 2FA, and
   confirms only the expected assets appear in Business Suite and Ads Manager.
   No credential or recovery code is sent to Pulse.
7. Run a no-spend validation: view Page/Instagram insights, open the correct ad
   account, confirm its currency/timezone, and view pixel diagnostics. For Page
   operations, create a draft or scheduled test and have Daniel review it.
8. Daniel sets the first campaign's budget/creative approval boundary before
   any ad is published. The operator does not edit payment methods.
9. Record the grant in the access register and schedule a 30-day review. Remove
   unused permissions immediately; conduct quarterly access reviews thereafter.
10. At offboarding or suspected compromise, Daniel removes the person/partner
    from every assigned asset, reviews sessions and integrations, rotates or
    revokes any related token, pauses unauthorized campaigns, and records the
    incident/action.

## Official Meta sources

- [About Facebook Page access](https://www.facebook.com/help/289207354498410/)
  explains Facebook access, full control, and task access.
- [Give, edit or remove Facebook Page access](https://www.facebook.com/help/187316341316631)
  states that only someone with full control can manage Page access.
- [Add people to an ad account](https://www.facebook.com/help/messenger-app/195296697183682/)
  defines Analyst, Advertiser, and Admin roles and says account sharing is
  against Meta's rules.
- [Facebook two-factor authentication](https://www.facebook.com/help/148233965247823)
  documents security keys, authenticator apps, SMS, recovery codes, and login
  alerts.
- [Facebook account security](https://www.facebook.com/help/213481848684090)
  warns about malicious Business Manager partner requests and password sharing.
- [Why business integrations request access](https://www.facebook.com/help/615546898822465/)
  describes OAuth consent and notes that removing an integration can leave
  separately created portfolio integrations to review.
- [Meta access-token types and lifecycle](https://developers.facebook.com/docs/facebook-login/guides/access-tokens/)
  covers user, Page, app, and system-user tokens, server-only handling, and
  typical token lifetimes.
- [Marketing API authorization and access tiers](https://developers.facebook.com/docs/marketing-api/overview/authorization/)
  covers `ads_read`, `ads_management`, App Review, and access tiers.
- [Pages API getting started](https://developers.facebook.com/docs/pages-api/getting-started/)
  lists the Page token and permissions required for Page API operations.
- [Instagram API with Facebook Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/get-started/)
  covers the linked Page/Instagram professional-account discovery flow and App
  Review.
- [System users](https://developers.facebook.com/docs/marketing-api/system-users/)
  documents programmatic Business Manager access.

## Final disposition

The safest current path is **named, native Meta Business Portfolio delegation
with partial/task access and mandatory 2FA**. There is no need to expose a
password or long-lived token, and no current requirement justifies a direct API
credential. Daniel's only immediate external actions are the owner-only
inventory, security hardening, and scoped invite. Pulse can then operate and
audit only the assigned assets.
