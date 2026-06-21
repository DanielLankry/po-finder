# Israeli Web-Law Compliance Audit

Date: 2026-05-18
Project: `pokarov.co.il` / `פה קרוב`

This is an engineering compliance audit, not legal advice. A licensed Israeli lawyer should review the final public policies before launch or paid acquisition.

## What Was Changed

- Rewrote the public `Privacy Policy`, `Terms of Use`, `Cancellation/Refund Policy`, and `Accessibility Statement` to match the actual product flows: Supabase auth, public business listings, reviews, HYP payments, contact forms, analytics, maps, emails, and local storage.
- Added a shared `LegalIdentity` block so legal pages surface the operator name, business number, address, contact email, phone/WhatsApp, and domain from `BUSINESS_INFO`.
- Gated both PostHog and Vercel Analytics behind the same explicit cookie consent.
- Added a footer control so users can reopen cookie preferences.
- Added checkout acceptance copy linking to terms, refund policy, and privacy policy.
- Added a dashboard profile notice that business profile fields are intended for public display.
- Escaped contact form and email-template values before inserting them into HTML emails.

## Critical Blocker

`lib/site-config.ts` still has missing legal identity fields:

- `legalBusinessName`
- `businessId`
- `address`
- `whatsappNumber` or another public phone/contact channel
- optionally `founderName`

For paid online transactions, these details should be completed before public paid traffic or checkout. The legal pages now intentionally show a warning when those fields are missing.

## Israeli Compliance Areas Covered

- Privacy notice: users are told what personal information is collected, purposes, controller contact, third-party recipients, retention, cookies/local storage, access/correction/deletion request route, and public listing behavior.
- Payments and remote-sale disclosure: terms and refund pages now describe price/period display, HYP hosted payment, non-auto-renewing prepaid periods, cancellation request channels, proportional charges, and statutory rights reservation.
- Accessibility: statement no longer overpromises full verified compliance; it describes the target standard, implemented accessibility measures, known Google Maps limitation, list-view alternative, and reporting route.
- Spam/direct marketing: terms and privacy state that marketing messages are not currently sent and would require separate consent plus opt-out mechanics.
- Evidence/security posture: contact-generated HTML email is now escaped to reduce privacy/security exposure.

## Lawsuit / Enforcement Proof Points

- Privacy Protection Authority guidance says Section 11 notices must include whether providing information is mandatory, controller identity/contact, collection purposes, recipients/purposes, and access/correction rights. It also flags financial sanctions for collection/use without consent or authority.
- The Consumer Protection and Fair Trade Authority complaint page lists common enforceable issues including misleading information, failure to provide required transaction information, and cancellation of transactions; complaints ask for business name, address, company/dealer number, transaction date and transaction channel.
- Accessibility litigation risk is real: Israeli class-action materials over inaccessible websites cite Regulation 35A and level AA web accessibility duties, and note that dynamic websites can face future proceedings if accessibility later breaks.
- Spam-law exposure is easy to sue on: Section 30A claims can seek up to NIS 1,000 per unlawful ad message without proof of damage. Supreme Court summaries for REA 7064/17 discuss spam claims as a deterrent mechanism and note the privacy/security problems caused by unsolicited advertising.

## Sources Checked

- Privacy Protection Authority digital tool on privacy duties and Section 11 notice: https://mojforms.justice.gov.il/mojaemprivacyprotectionauthority/dpiaform.html
- Privacy Protection Authority notice duty under Amendment 13 / sensitive large databases: https://www.gov.il/he/service/notice-obligation
- Privacy Protection Authority access-right guidance, Section 13: https://www.gov.il/BlobFolder/legalinfo/right_to_access2023/he/The%20right%20to%20access.pdf
- Consumer Protection and Fair Trade Authority complaint guidance: https://www.gov.il/he/service/filing_a_complaint_to_fair_trade_authority
- Consumer Protection Authority brochure on remote-sale cancellation: https://www.gov.il/BlobFolder/generalpage/general_tuota/he/HB_Brushur_SITE.PDF
- Service Accessibility Regulations PDF: https://www.gov.il/BlobFolder/guide/accommodating_service_providing_rules/he/sitedocs_service_acessibility_regulations.pdf
- Kol Zchut summary of Spam Law compensation under Section 30A: https://www.kolzchut.org.il/he/פיצוי_בגין_משלוח_דברי_פרסומת_ללא_הסכמה_של_הנמען_(חוק_הספאם)
- Supreme Court annual case-law summary, including REA 7064/17 spam-law discussion: https://supreme.court.gov.il/Documents/סיכום%20פסיקת%20בית%20המשפט%20העליון%20התשע"ט.pdf
- Accessibility class-action settlement examples citing Regulation 35A: https://www.dinrega.com/gs/בקשה%20לאישור%20הסדר%20פשרה%20בתובענה%20ייצוגית%20על%20אי-הנגשת%20אתר%20אינטרנט

## Remaining Lawyer Review Items

- Confirm whether the operator qualifies as a "consumer" seller to business owners or primarily B2B, and tune the refund policy accordingly.
- Confirm whether the database requires registration, notification, a database definition document, or DPO appointment under Privacy Protection Law Amendment 13 thresholds.
- Confirm whether the business must publish a named accessibility coordinator and phone number based on employee count and service scope.
- Confirm invoice wording, HYP merchant terms, and refund timing wording against the payment provider setup.
- Review Hebrew policy wording for enforceability and consumer-law non-waivable rights.
