# Authentication email setup

The hosted Supabase project requires **Confirm email enabled** and a working custom SMTP provider. These settings are separate from database migrations and from the Vercel deployment.

Production configuration was updated on 2026-09-09:

- SMTP uses the verified site domain through Resend, with a domain-scoped sending-only API key.
- Sender: `פה קרוב <noreply@pokarov.co.il>`.
- Host: `smtp.resend.com`; port: `465`; username: `resend`.
- Site URL: the canonical site domain.
- Redirect allowlist includes the exact production `/auth/callback` and a query-only pattern `/auth/callback\?**`, in addition to the existing localhost callback. Keep redirects restricted to the app; `safeRedirectPath` validates the destination.
- Confirm signup subject: `אימות כתובת המייל שלכם | פה קרוב`; body: `supabase/templates/confirmation.html`.
- Recovery subject: `איפוס הסיסמה שלכם | פה קרוב`; body: `supabase/templates/recovery.html`.

Deploy the app route before installing the signup template. The signup email opens `/auth/confirm#token_hash=...`. Loading the page does not consume the token; a deliberate button POST does. This protects against automatic email link scanners and works without the original browser's PKCE cookie. A new hash in the same tab is supported.

Keep the confirmation page's referrer policy at `same-origin`. A native form POST from a `no-referrer` page can send `Origin: null`, which the callback correctly rejects. The fragment is never part of an HTTP request URL and is cleared before submission. The confirmation surface excludes browser tracking.

Signup role and return intent are stored in auth metadata, allowlisted, and used only after verification. A public profile must persist before a successful registration redirect is emitted. Resends reuse the signup callback and have a 60-second client cooldown in addition to provider limits.

Recovery emails retain Supabase's ConfirmationURL and redirect through `/auth/callback?next=%2Fauth%2Freset-password`, allowing the PKCE code to become a session before password entry.

Keep SMTP keys only in the provider settings and ignored local secret storage. Never put a real email token, password, or provider key into tests, screenshots, logs, commits, or audit reports.

Validation on 2026-09-09 covered delivered signup/resend emails, blocked pre-verification login, successful deliberate confirmation, one persisted owner profile, the intended billing redirect, rejection of a reused link, and delivery of a recovery link that opened the new-password form. The password itself was not changed.
