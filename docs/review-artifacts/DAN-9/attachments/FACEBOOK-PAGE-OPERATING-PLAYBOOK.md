# Facebook Page Management Operating Playbook

> **Brand:** פה קרוב (Po Karov; “Po Finder” is an internal/project reference only)  
> **Owner:** Page Owner / accountable business owner  
> **Operator:** Pulse  
> **Version:** 1.0  
> **Prepared:** 28 July 2026  
> **Status:** Ready for owner approval; not authorized for execution  
> **Scope:** Organic Facebook Page management. Paid campaigns remain governed by `CAMPAIGN-ARCHITECTURE.md` and the active advertising approval process.

## 1. Operating decision

Pulse will run the Page as a controlled community and demand-generation channel for two audiences:

1. people looking for nearby small and mobile businesses; and
2. small-business owners considering a listing.

The Page should make the product useful before it makes it promotional: show real local discovery, explain how the map works, answer questions clearly, and only then ask people or businesses to act.

### Non-negotiable approval gate

Until the Page Owner explicitly changes this policy in writing:

- Pulse may research, plan, draft, classify, and recommend.
- Pulse may not publish, schedule, edit, delete, hide, reply, react, send a message, ban a user, connect an account, enable an automation, boost a post, or change a Page setting without item-specific approval.
- Silence, a prior similar approval, or a calendar entry is not approval.
- Approval must name the item and action, for example: `APPROVED — FB-2026-08-03-01 — schedule for 3 Aug at 19:30 IDT`.
- Material changes after approval—claim, price, link, visual, featured business, targeting, or publish time—return the item to `CHANGES REQUESTED`.
- A scheduled item may be cancelled before publication without new approval if a fact becomes false, a featured business withdraws consent, the linked page fails, or a safety/legal concern appears. Pulse records the cancellation and alerts the Page Owner.

This gate also applies to “helpful” or urgent replies. For a safety-critical case, Pulse escalates immediately and prepares a holding response, but does not post it without approval.

## 2. Source of truth and brand safeguards

### 2.1 Product truth hierarchy

When sources conflict, use this order:

1. live production page at `https://pokarov.co.il`;
2. `lib/site-config.ts` and the current terms, privacy, refund, pricing, vendor, and about pages;
3. an owner-approved campaign brief dated after the code/content above;
4. this playbook;
5. older strategy and creative files.

The current offer is **not** a $5 monthly subscription. As of this version, the approved product truth is:

- visible Hebrew brand: **פה קרוב**;
- domain: **pokarov.co.il**;
- people discover small, local, stall-based, and mobile businesses by location, category, and opening hours;
- a business can create a private draft for free;
- after verification, the business chooses a visibility period from one day to 12 months and pays once;
- there is no automatic renewal and no commission on sales;
- the current launch offer shown by the product is six months for ₪41;
- the regular displayed range is ₪3–₪61 depending on the visibility period.

Before every price- or feature-led post, Pulse checks the live destination and `lib/site-config.ts`. Do not reuse the legacy `$5/month`, subscription, `po.co.il`, “thousands of users,” or other unverified claims from older campaign documents.

### 2.2 Voice

- **Language:** Hebrew first, natural RTL. Use English only when it helps a user who wrote in English.
- **Personality:** warm, direct, neighborly, clear, and supportive.
- **Register:** conversational plural address; no corporate filler or aggressive scarcity.
- **Promise:** help people find nearby independent businesses and help those businesses be discoverable.
- **Proof over hype:** show the map, a real feature, a real consenting business, or a verifiable fact.

### 2.3 Visual and content guardrails

- Use the current logo and product-paper system: warm paper, deep green ink, terracotta accent, map geometry, tactile borders/shadows.
- Use real product screenshots and real local-business imagery where practical.
- Obtain written permission before featuring a business, owner, customer, testimonial, private message, review, identifiable person, trademark, or user-submitted image.
- Confirm the business name, location, hours, event date, link, and offer with the featured business before approval.
- Do not imply endorsement, guaranteed traffic, guaranteed revenue, platform vetting beyond the actual verification process, or that a business is currently open unless checked at publication time.
- Do not publish customer personal data, order/payment details, account status, exact private location, IDs, phone numbers supplied in a private conversation, or screenshots containing them.
- Never ask for passwords, payment-card details, government ID, or authentication codes in comments or Messenger.
- Add useful alt text to images; caption spoken video; keep essential text readable and out of crop-safe areas.
- Do not use tragedy, conflict, religion, ethnicity, disability, or other sensitive traits as engagement bait.
- Avoid political advocacy from the brand Page unless separately approved with legal/policy review.

## 3. Roles and access model

| Role | Normal access | Accountable for | May approve |
|---|---|---|---|
| Page Owner | Facebook access with full control | Brand, legal/business decisions, access, settings, final risk ownership | All routine and sensitive actions |
| Backup Owner | Facebook access with full control, held by a second trusted person | Recovery and continuity | Only when formally delegated by Page Owner |
| Pulse | Task access limited to content, messages/community activity, and insights; ads only if separately needed | Calendar, drafts, moderation triage, reporting | Nothing on behalf of the owner |
| Legal/privacy adviser | No standing Page access required | Legal threats, privacy rights, regulator/law-enforcement requests | Wording in their domain; Page Owner still authorizes Page action |
| Security/technical owner | Minimum access needed for incident | Compromise, impersonation, data/security issues | Containment recommendation; Page Owner authorizes external action unless emergency account-recovery controls require the full-control owner |

Meta distinguishes full-control Facebook access from task access. Full control can change settings, grant/remove access, remove another owner, or delete the Page, so it is not appropriate for routine operation. Pulse should receive only the task permissions actually required.

### Access safeguards

- Each person uses an individual authentic account; never share credentials.
- Require two-factor authentication for every person with Page or business-portfolio access, preferably an authenticator app or security key, plus a secured recovery method.
- Keep at least two trusted full-control owners for continuity, but as few as operationally possible.
- Page Owner records the Page ID, business portfolio, linked Instagram account, ad account, Pixel/dataset, verified domain, recovery contacts, and access owners in a private asset register.
- Review access monthly for the first 90 days and quarterly thereafter; remove access the day a role ends.
- Review active sessions, security alerts, connected apps, and business integrations quarterly.
- Pulse never adds people, partners, integrations, or apps.

## 4. Content system

### 4.1 Pillars and mix

| Pillar | Purpose | Target share | Example |
|---|---|---:|---|
| Local discovery | Give consumers an immediate reason to use the map | 30% | “Three kinds of places to look for near you this week” using real inventory |
| Business spotlight | Create useful local proof and support listed businesses | 20% | A consenting business: what it offers, verified hours/location, map link |
| Product education | Reduce friction for consumers and owners | 20% | How to search by category/hours; how a business creates a free draft |
| Owner education | Help small businesses improve discoverability | 15% | Checklist for photos, accurate location, and opening hours |
| Community conversation | Learn what the audience wants and encourage replies | 10% | “Which type of local stall should we add next?” |
| Trust and operations | Explain safety, privacy, pricing, or service changes | 5% | Clear one-time-payment explainer or a planned maintenance notice |

Event content is a format within local discovery or business spotlight only when a real, current event exists and the business has approved the details. Never manufacture event urgency.

### 4.2 Cadence

Start with a sustainable four-week pilot:

- **Feed:** three posts per week—Sunday, Tuesday, Thursday.
- **Stories:** up to two story sets per week, normally Monday and Wednesday, only when assets are useful and approved.
- **Video/Reel:** one of the three weekly feed posts may be a short video; do not add volume merely to hit a format quota.
- **Inbox/comments:** monitored during coverage hours; no proactive outbound messaging.
- **Refresh:** review the next two weeks of calendar every Wednesday; lock the following week by Thursday.

Default publish windows for testing are 12:00–14:00 or 18:30–20:30 Israel time. These are test windows, not claimed best times. After four weeks, use Meta Business Suite data to choose times.

If there is not enough verified, permissioned content, publish less. No placeholder, recycled claim, or unapproved business feature is required to satisfy cadence.

### 4.3 Item record and lifecycle

Every item gets an ID such as `FB-2026-08-03-01` and a record containing:

- audience, pillar, objective, format, owner;
- Hebrew copy, visual/alt text, destination URL and UTM;
- product-fact check date and source;
- permissions/consent evidence;
- risk tier;
- approver, decision, decision timestamp, and exact approved version;
- scheduled/published time and permanent URL;
- 24-hour and 7-day results;
- changes, corrections, or incident link.

Lifecycle:

`IDEA → DRAFT → FACT CHECKED → PENDING APPROVAL → APPROVED → SCHEDULED → PUBLISHED → MEASURED → ARCHIVED`

Alternative terminal states are `CHANGES REQUESTED`, `REJECTED`, `CANCELLED`, and `RETRACTED`.

## 5. Approval workflow

### 5.1 Risk tiers

| Tier | Examples | Required review |
|---|---|---|
| R0 — internal only | Idea, unpublished draft, report | Pulse |
| R1 — routine public | Product tip using current copy; non-controversial community question; thanks reply | Page Owner item approval |
| R2 — material | Price/offer; featured business; testimonial; complaint response; correction; contest; user-generated content | Page Owner plus fact/consent evidence |
| R3 — sensitive | Payment/refund dispute; privacy request; threat; hate/harassment; alleged fraud; legal/media/regulator request; security incident; vulnerable-person concern | Relevant specialist recommendation plus Page Owner approval |

### 5.2 Approval matrix

| Action | Pulse prepares | Required explicit approval | Evidence before action | SLA from receipt |
|---|---|---|---|---|
| Routine feed post/story/Reel | Final copy, creative, alt text, link, fact check | Page Owner | Item ID + immutable preview/version | Submit ≥2 business days before planned time |
| Price, offer, feature, or policy post | Same plus source quotation/location | Page Owner | Current live-page/code check | Submit ≥3 business days before |
| Featured business/event/testimonial | Same plus business confirmation | Page Owner | Written usage permission and fact confirmation | Submit ≥3 business days before |
| Routine public comment reply | Thread link, screenshot, draft, R1 label | Page Owner | No private facts; answer verified | Draft ≤2 coverage hours |
| Critical/negative comment | Context, proposed public reply, private-hand-off plan | Page Owner | R2/R3 classification and case record | Triage ≤30 min; draft ≤1 coverage hour |
| Routine inbound message | Context, draft, proposed label/status | Page Owner | Identity/data-minimization check | Draft ≤2 coverage hours |
| Account/payment/refund/privacy message | Holding draft and secure-channel hand-off | Page Owner; specialist for R3 | No account details exposed in Messenger | Triage ≤30 min; draft ≤1 coverage hour |
| Hide/delete comment, restrict/ban/report user | Evidence capture and reason | Page Owner | Policy category, screenshot, URL, timestamp | Immediate escalation for P1; otherwise same day |
| Correction/retraction | Correct fact, affected posts, proposed notice | Page Owner; specialist if R3 | Incident record | Draft ≤1 hour after confirmation |
| Page setting/access/automation | Before/after, reason, rollback, permissions | Page Owner | Change ticket and test plan | No default deadline |
| Boost/ad | Campaign objective, audience, budget, creative, tracking | Separate paid-media approval | Budget owner approval | Per campaign plan |

An approval applies only to the specified Page, item ID, version, channel, action, and time window. A 👍 reaction is not approval unless the Page Owner has explicitly designated that exact reaction as the approval mechanism for the specific item.

### 5.3 Sensitive-response sequence

1. Capture the URL, timestamp, screenshot, sender, exact text, and visible context.
2. Classify severity and preserve evidence before recommending hide/delete/report.
3. Do not investigate publicly or ask for more sensitive details in Messenger.
4. Draft the minimum public acknowledgement and a move to the official secure contact path.
5. Alert the Page Owner and named specialist in the case record.
6. Obtain approval; publish/send only the approved text.
7. Record action, owner, timestamps, and follow-up due date.
8. Close only when the owner confirms disposition; do not treat “response sent” as “issue resolved.”

## 6. Moderation, escalation, and response targets

### 6.1 Coverage and clocks

Initial coverage is Sunday–Thursday, 09:00–18:00 Israel time, excluding published holidays. Pulse checks Inbox/comments at 09:00, 13:00, and 17:00. P1 alerts are routed immediately if monitoring is available; the playbook does not promise 24/7 coverage.

Track two clocks separately:

- **Draft SLA:** receipt to a complete draft/escalation packet.
- **Action SLA:** approval to the approved Page action.

The waiting-for-owner-approval interval is reported separately, not hidden inside operator response time. Automated acknowledgements do not count as a human response or resolution.

| Priority | Case | Draft/triage target | Owner alert | Approved action target |
|---|---|---:|---:|---:|
| P1 Critical | Credible threat, doxxing, child-safety issue, Page compromise, active impersonation/scam, regulator/law-enforcement request, suspected data incident | 15 min during coverage | Immediate | 15 min after approval |
| P2 High | Payment/refund allegation, privacy-rights request, discrimination/hate, alleged fraud, media inquiry, coordinated abuse | 30 min | ≤30 min | 30 min after approval |
| P3 Standard | Complaint, incorrect listing/hours, product bug, account help, owner inquiry | 2 coverage hours | In next approval queue | 1 coverage hour after approval |
| P4 Routine | Praise, suggestion, ordinary product question, emoji-only comment | 4 coverage hours | Daily approval batch | 2 coverage hours after approval |

Items received outside coverage are triaged by 10:00 on the next coverage day unless an approved on-call path exists.

### 6.2 Moderation rules

| Content | Default recommendation | Notes |
|---|---|---|
| Good-faith criticism or negative experience | Keep visible; acknowledge and move case-specific details private/secure | Never hide merely because it is negative |
| Incorrect claim about product | Correct politely with a current link | Preserve screenshot; do not shame user |
| Spam or irrelevant promotion | Hide; repeat behavior may be blocked | Capture evidence before action |
| Scam, impersonation, phishing | Preserve, report, hide/remove, escalate P1/P2 | Never click suspicious links from operator device |
| Hate, targeted harassment, sexual exploitation, credible threat, doxxing | Preserve, report, hide/remove; consider block | P1/P2; owner determines external escalation |
| Profanity without target/threat | Keep if substantive, or hide if disruptive under approved policy | Apply consistently, not based on viewpoint |
| Personal/account/payment information | Hide from public view and move to secure support | Do not repeat the information in reply |
| Legal, regulator, law-enforcement, press | Acknowledge receipt only with approved wording | Do not debate, admit liability, or promise outcome |

Never delete a Page-authored post/comment to conceal an error. Preserve it, prepare a transparent correction/retraction, and obtain approval.

### 6.3 Response principles

- Answer the question asked in the first sentence.
- State what is known, what needs checking, and when the next update is due.
- Do not promise refunds, listing approval, feature delivery, response by another party, or business outcomes.
- Use the official site/contact path; do not shift users to a personal profile.
- Do not disclose whether a named person has an account or payment.
- End argumentative loops after one clear answer and one clarification unless new facts appear.

## 7. Page settings and launch checklist

All entries below are proposed checks or changes. Pulse must first document the current state, then submit a before/after change set for approval. Nothing in this section authorizes a Page change.

### 7.1 Identity and customer path

- [ ] Page name is `פה קרוב`; username is an owner-approved `pokarov` variant.
- [ ] Profile and cover images use current assets and safe mobile crops.
- [ ] Category accurately describes an online local-business discovery service.
- [ ] About text matches the current product; website is `https://pokarov.co.il`.
- [ ] CTA points to the single owner-selected destination (map or business-joining flow) and uses an organic Facebook UTM.
- [ ] No public street address implies a storefront if the service has none.
- [ ] Support email is current. Publish the WhatsApp/phone number only after the owner confirms it is intended for public Page support and coverage exists.
- [ ] Privacy, terms, accessibility, and refund links are reachable from the destination site.
- [ ] Page handle, display name, category, and link match the linked Instagram profile where appropriate.

Recommended organic UTM pattern:

```text
utm_source=facebook&utm_medium=organic_social&utm_campaign=page_{yyyy_mm}&utm_content={item_id}
```

### 7.2 Messaging and moderation

- [ ] Messenger availability and coverage hours match the actual service level.
- [ ] Notifications are enabled for the active operator and owner on the devices they intentionally use.
- [ ] Inbox labels exist: `new`, `needs-approval`, `business-owner`, `consumer`, `listing-data`, `billing-refund`, `privacy-legal`, `security-safety`, `follow-up`, `done`.
- [ ] Greeting/instant reply, away reply, and FAQ answers are owner-approved, accurate, and do not claim a human has reviewed the message.
- [ ] Visitor-post and tagging settings are reviewed; recommend review-before-display where available.
- [ ] Moderation Assist, profanity controls, and a Hebrew/English keyword list are tested for false positives before activation.
- [ ] Comment sorting and spam controls do not suppress legitimate criticism.
- [ ] Blocking criteria match Section 6 and are applied consistently.

### 7.3 Security and asset integrity

- [ ] Page is in the owner’s Meta business portfolio.
- [ ] Two trusted full-control owners and least-privilege task operators are recorded.
- [ ] Two-factor authentication and login alerts are active for every person with access.
- [ ] Linked Instagram, ad account, Pixel/dataset, and verified domain belong to the correct portfolio.
- [ ] Former people/partners, unused apps, and stale system users are removed after approval.
- [ ] A quarterly access review and incident contact tree are scheduled.
- [ ] Recovery codes are stored in an owner-controlled secure vault, never in a content calendar or chat.
- [ ] Page quality, support inbox, and account-status surfaces are reviewed weekly.

## 8. Automation opportunities and boundaries

Automation should reduce sorting and delay, not make judgment on sensitive cases.

| Opportunity | Recommended scope | Guardrail |
|---|---|---|
| Scheduled publishing | Owner-approved posts only | Exact version/time approval; preview link; pre-publish fact check |
| Instant greeting | Receipt + coverage hours + safe links | Must say it is automatic; no claim of case review |
| Away message | Next coverage window | Do not promise a resolution time |
| FAQ/keyword reply | Navigation, free-draft basics, how the map works | Enable only after owner approves every answer; exclude price if it cannot remain synced |
| Inbox labels/rules | Route keywords such as refund/privacy/security to review | Labels may prioritize; they may not send a substantive sensitive reply |
| Moderation Assist | Obvious spam/scam/slur patterns | Start in review mode; weekly false-positive audit; approval before action |
| Reporting export | Weekly Page/post metrics and UTM results | Read-only; no personal conversation content in report |
| Calendar reminders | Approval due, consent expiry, fact recheck, 24h/7d measurement | Internal only |

Do not deploy generative-AI auto-replies, autonomous moderation, unsolicited outbound messaging, auto-deletion, auto-banning, or automatic boosting. Meta notes that automated/AI chats may require disclosure and can be inaccurate; the controlled-launch model keeps humans and the Page Owner in the loop.

### Owner-approved instant greeting draft

This is a draft, not authorized for activation:

> היי, תודה שכתבתם לפה קרוב. זו הודעה אוטומטית שמאשרת שהפנייה התקבלה. אנחנו בודקים הודעות בימים א׳–ה׳, 09:00–18:00. אל תשלחו כאן סיסמאות, פרטי כרטיס או מסמכי זיהוי. למידע על השירות: https://pokarov.co.il/about

### Owner-approved away-message draft

This is a draft, not authorized for activation:

> תודה שכתבתם. כרגע אנחנו מחוץ לשעות המענה, ונבדוק את הפנייה ביום הפעילות הבא. אם מדובר בחשבון, תשלום או פרטיות, כתבו תיאור כללי בלבד — בלי סיסמה, פרטי כרטיס או מסמך מזהה.

## 9. Sample two-week content calendar

The calendar demonstrates the workflow; it is not publishing approval. Featured-business slots remain conditional on written permission and verified live inventory.

| ID | Date/time (IDT) | Audience / pillar | Format | Draft concept and CTA | Evidence / risk |
|---|---|---|---|---|---|
| FB-2026-08-02-01 | Sun 2 Aug, 19:30 | Consumers / Local discovery | 4-card carousel | `מה נמצא קרוב אליכם היום?` Show map → category → hours → business profile. CTA: `פותחים את המפה` | Current screenshots; link test; R1 |
| FB-2026-08-04-01 | Tue 4 Aug, 12:30 | Owners / Product education | Static + caption | `טיוטה בחינם, לפני שבוחרים זמן הופעה.` Explain draft → verification → one-time duration choice. CTA: `בודקים איך זה עובד` | Check `site-config.ts`, `/vendors`, `/pricing`; R2 |
| FB-2026-08-06-01 | Thu 6 Aug, 19:30 | Both / Community | Text + simple map visual | `איזה עסק קטן הייתם רוצים למצוא קרוב יותר לבית?` Invite category answers; no implied inventory | Moderation plan ready; R1 |
| FB-2026-08-09-01 | Sun 9 Aug, 19:30 | Consumers / Business spotlight | Photo + map link | `הכירו את [שם העסק]` with verified offer, hours, and location summary | Written business/image permission; details checked day-of; R2 |
| FB-2026-08-11-01 | Tue 11 Aug, 12:30 | Owners / Owner education | Checklist carousel | `5 דברים שכדאי לעדכן כדי שלקוחות יגיעו בזמן הנכון`: location, category, hours, photo, contact | Feature check; no outcome guarantee; R1 |
| FB-2026-08-13-01 | Thu 13 Aug, 19:30 | Both / Trust | Static explainer | `בלי מנוי ובלי חידוש אוטומטי.` Explain one-time visibility periods and link to current pricing | Same-day price/terms check; R2 |

### Full sample copy: consumer discovery

**FB-2026-08-02-01 — draft only**

> מחפשים עגלת קפה, דוכן אוכל או עסק קטן קרוב אליכם?  
> בפה קרוב אפשר לחפש על המפה לפי מיקום, קטגוריה ושעות פעילות — בלי להוריד אפליקציה.  
> פותחים את המפה: [approved UTM link]

Alt text:

> ארבעה מסכים של פה קרוב: פתיחת המפה, בחירת קטגוריה, בדיקת שעות פעילות ופתיחת פרופיל עסק.

### Full sample copy: owner education

**FB-2026-08-04-01 — draft only**

> רוצים לבדוק איך העסק שלכם ייראה לפני תשלום?  
> יוצרים טיוטה פרטית בחינם, מוסיפים פרטים ותמונות, ואחרי אימות בוחרים תקופת הופעה מיום אחד ועד 12 חודשים. התשלום חד־פעמי וללא חידוש אוטומטי.  
> מתחילים מטיוטה: [approved UTM link]

Before approval, recheck every commercial claim against the live pricing/joining flow.

## 10. Weekly reporting

### 10.1 Report rhythm

- **Cut-off:** Sunday 00:00 through Saturday 23:59 Israel time.
- **Pulse draft:** Monday by 12:00.
- **Owner review:** Monday by 18:00.
- **Decision output:** keep/change/stop by pillar, format, and audience; next test owner; unresolved risks.
- **Windows:** report both 24-hour and 7-day post performance. Label immature posts rather than mixing partial and complete windows.
- **Baseline:** first four weeks establish an organic baseline. Do not invent industry benchmarks or change strategy from a single small post.

### 10.2 KPI dictionary

| KPI | Definition / formula | Source | Decision use |
|---|---|---|---|
| Posts published | Count of Page feed posts published in period | Content log | Cadence, not a success metric |
| Reach | Unique accounts shown content, as reported by Meta | Meta Business Suite Insights | Distribution |
| Impressions/views | Total content displays/views using Meta’s displayed definition | Meta Business Suite | Frequency/context; never relabel as reach |
| Engagements | Reactions + comments + shares + saves where Meta exposes them | Meta Business Suite/export | Interaction volume |
| Engagement rate by reach | `engagements / reach × 100` | Calculated | Compare content at different reach |
| Meaningful engagement rate | `(substantive comments + shares + saves) / reach × 100` | Export + manual classification | Utility/community quality |
| Link clicks | Clicks on the destination link as reported by Meta | Meta Business Suite | On-platform intent |
| Organic site sessions | GA4 sessions with `source=facebook`, `medium=organic_social` | GA4 | Actual site arrival |
| Landing-page click-through | `organic site sessions / reach × 100`; label cross-platform limitations | Meta + GA4 | Content-to-site effectiveness |
| Business-start intent | Consent-qualified `Lead` events or the active business-draft-start event attributable to organic Facebook | Meta Events/GA4/PostHog, using current implementation | Owner acquisition signal |
| Completed business registration | Consent-qualified `CompleteRegistration` for `business_owner`, attributed where possible | Meta Events/GA4/PostHog | Funnel progress |
| Purchase | Succeeded owned payment event attributable to organic Facebook; use value/currency from the real transaction | Meta Events/first-party payment data | Revenue outcome |
| Net follows | Follows minus unfollows in period, if available | Meta Business Suite | Audience health |
| Video 3-second views / watch time | Use Meta’s current named metrics without redefining them | Meta Business Suite | Video hook/retention |
| Inbound contacts | New comment/message threads needing response | Inbox log | Workload and demand |
| Draft-SLA attainment | `cases drafted within priority target / cases due × 100` | Case log | Operator performance |
| Approval latency | Median time from complete approval request to decision | Approval log | Governance bottleneck |
| Action-SLA attainment | `approved actions completed within target / approved actions due × 100` | Case log | Execution reliability |
| First human response time | Median receipt-to-first approved human reply; automations excluded | Inbox + approval log | Customer experience |
| Open backlog | Cases awaiting draft, approval, action, or follow-up at cut-off | Case log | Risk/capacity |
| Escalations / corrections | Counts by P1–P4 and cause | Incident log | Trust/risk trend |

Privacy caveat: Meta Pixel is consent-gated in the current product, so site conversion counts are not total visitor counts. Do not reconcile them as if every visitor were observable. Use first-party payment truth for revenue and label attribution limitations.

### 10.3 One-page weekly template

```markdown
# Facebook Page weekly readout — YYYY-Www

Status: Green / Amber / Red

## Outcome
- Published: __ planned / __ actual
- Reach: __ (WoW __%)
- Organic Facebook sessions: __ (WoW __%)
- Business-start intent: __
- Completed business registrations: __
- Attributed purchases / revenue: __ / ₪__

## Content
- Best item: [ID + link] — why, based on evidence
- Weakest item: [ID + link] — why, based on evidence
- Pillar/format comparison: __
- Next controlled test: hypothesis, single changed variable, success measure

## Community and service
- New contacts: __
- Draft-SLA attainment: __%
- First human response time: __
- Awaiting approval: __ (oldest: __)
- P1/P2 escalations: __

## Integrity
- Corrections/retractions: __
- Moderation actions by reason: __
- Tracking/metric gaps: __
- Permissions expiring or missing: __

## Decisions needed
1. [item, recommendation, owner, due time]
```

### 10.4 Initial targets

For weeks 1–4, targets are operational, not growth claims:

- 100% of public actions have traceable item-specific approval.
- 100% of featured businesses/assets have permission evidence.
- 100% of price/offer posts have a same-day source check.
- ≥90% of routine cases meet the Draft SLA during coverage.
- 100% of P1/P2 items are escalated within target.
- zero uncorrected known factual errors at weekly cut-off.
- zero credentials, authentication codes, payment-card details, or private account facts requested or exposed.

After four complete weeks, Pulse proposes numerical reach, engagement, click, and conversion targets from the median baseline by pillar/format. The Page Owner must approve those targets before they become commitments.

## 11. Weekly operating rhythm

| Day | Pulse work | Owner decision |
|---|---|---|
| Sunday | Confirm scheduled-item facts; monitor launch; tag results due | Approve any same-day exception |
| Monday | Deliver prior-week report; draft next-week concepts | Decide keep/change/stop and unresolved escalations |
| Tuesday | Prepare copy/creative, permissions, links, alt text | Review R2 items |
| Wednesday | Submit the complete next-week batch; review automations/moderation false positives | Approve, reject, or request changes by item |
| Thursday | Apply revisions; lock approved schedule; run link/crop checks | Give exact schedule approval |
| Friday/Saturday | No normal coverage; only an approved on-call route handles critical alerts | On-call owner if separately assigned |

Daily coverage loop:

1. inspect Inbox, comments, mentions, Page quality, and security alerts;
2. label and prioritize;
3. capture evidence for anything potentially moderated;
4. draft responses and approval packets;
5. act only on approved items;
6. record action and follow-up;
7. verify scheduled posts and broken links.

## 12. Launch and rollback plan

### Phase 0 — current state

- Deliver this playbook.
- Do not request or use Page access until the Page Owner approves the operating model and access scope.
- Do not alter any Page setting, automation, content, comment, or message.

### Phase 1 — read-only baseline

After explicit approval and access grant:

- inventory current Page/portfolio assets and permissions;
- capture existing Page settings without changing them;
- export the prior 28 days of available Page/content metrics;
- record current Inbox backlog, response indicators, Page quality, and security alerts;
- submit a change set for approval.

### Phase 2 — controlled pilot

After change-set and calendar approvals:

- configure only approved settings/labels/automations;
- publish only approved pilot items;
- use item-level approval for every response and moderation action;
- report weekly for four weeks.

### Phase 3 — owner review

At week four, the owner chooses to:

- continue item-level approval;
- pre-approve narrowly defined routine templates while retaining item approval for publishing;
- change cadence or coverage;
- pause operations and revoke task access.

Any relaxation of approval must be explicit, versioned, and narrower than full discretion.

### Rollback

- **Wrong fact/link/price:** stop scheduled variants, preserve evidence, draft correction, alert owner, publish only approved correction.
- **Automation misfire:** owner approves disabling automation; preserve example, scope impact, and audit all affected conversations.
- **Account compromise:** use the owner-controlled recovery path, revoke suspicious sessions/access, preserve evidence, check Page/ads/integrations, and issue public notice only if approved.
- **Unexpected backlash:** pause related scheduled content, keep good-faith criticism visible, classify material themes, and submit a response recommendation.
- **Permission withdrawal:** stop future use immediately, remove scheduled assets, and seek owner approval for removal/replacement of already-published content.

## 13. Pre-flight checklists

### Post/story/Reel

- [ ] Item ID and exact version attached
- [ ] Audience, pillar, objective, and metric named
- [ ] Hebrew/RTL reviewed
- [ ] Product claims checked against current source
- [ ] Price/offer checked on the day of submission and publication
- [ ] Business/person/image/music rights documented
- [ ] Link opens correctly on mobile; UTM is correct
- [ ] Visual crop, captions, and alt text checked
- [ ] No personal/private data
- [ ] Risk tier and escalation owner named
- [ ] Item-specific owner approval recorded
- [ ] Final scheduled preview matches approved version

### Comment/message

- [ ] Thread URL/screenshot and timestamp captured
- [ ] P1–P4 and R1–R3 assigned
- [ ] No sensitive details repeated or requested
- [ ] Answer verified; no unsupported promise
- [ ] Secure hand-off path used when needed
- [ ] Exact draft approved for this thread
- [ ] Reply/action and timestamp recorded
- [ ] Follow-up owner and due date recorded

### Setting/automation

- [ ] Current state captured
- [ ] Proposed state, purpose, risk, and rollback written
- [ ] Permissions required identified
- [ ] Test case and expected result written
- [ ] Owner approval names exact change
- [ ] Post-change evidence captured
- [ ] False-positive or unintended-action check completed

## 14. Platform references

Meta’s interface and metric labels can change. Verify availability at execution time using current official help:

- [About Facebook Page access](https://www.facebook.com/help/289207354498410)
- [Blocking and moderation](https://www.facebook.com/help/248844142141117)
- [About Inbox in Meta Business Suite](https://www.facebook.com/help/messenger-app/294426838452244)
- [Create and manage labels for Page messages](https://www.facebook.com/help/935707876542654)
- [See insights for Facebook Page posts](https://www.facebook.com/help/131809553587433)
- [Two-factor authentication](https://www.facebook.com/help/148233965247823)

## 15. Owner approval block

Approval of this playbook means approval of the operating model only. It does **not** approve Page access, a Page setting, an automation, the sample calendar, sample copy, publishing, messaging, moderation, or spending.

Owner decision:

- [ ] Approved as written
- [ ] Approved with changes recorded in a new version
- [ ] Not approved

Owner: ____________________  
Revision approved: ____________________  
Date/time/time zone: ____________________

