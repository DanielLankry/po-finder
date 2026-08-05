# DRAFT / NOT APPROVED FOR PUBLICATION

# DAN-131 — Meta ad draft package

Prepared: 2026-08-05  
Review owner and sole publication gate: Daniel  
Scope: copy, creative audit, ranking, and production specifications only

This package does **not** authorize or record any Meta upload, campaign creation,
audience change, scheduling, activation, billing change, or spend. No source image
is approved for public use. Every proposed ad below remains an internal draft.

## Executive decision

- **Do not run the seven consumer-discovery stories or the two consumer launch
  posters while the live marketplace is empty.** They promise nearby businesses,
  open-now results, variety, or discovery that the product cannot currently show.
- **Use owner acquisition as the only draftable campaign direction.** The third
  launch poster has the right audience, but its art must be rebuilt and its
  performance claims removed. The night-falafel and jewelry scenes are useful only
  as visual references for owner-segment variants.
- **Do not export derivatives from these PNGs yet.** The repository supplies no
  photographer/illustrator/AI-generation provenance, commercial-use licence,
  model/property releases, or source project files. Several images also contain
  malformed Hebrew and fictional signage baked into the pixels.
- Copy and layout specifications for four owner-acquisition drafts are approved
  for internal review below. Creative files remain blocked on rights evidence and
  a clean rebuild. Daniel must approve both before anything enters Meta.

## Source and verification

- Repository: `DanielLankry/po-finder`
- Source branch at audit time: `codex/brand-kit-assets`
- Exact audited commit: `96bcdebad89b455e565fa03f13ad9706e6fb0e46`
- Source folder:
  `marketing-assets/2026-08-05-brand-kit/05-ad-creatives`
- Coverage: 3/3 launch posters and 7/7 story creatives.
- All ten source ad PNGs are `941×1672` (approximately 9:16), RGB, and carry no
  rights/source sidecar in the supplied folder. The separate brand-reference PNG
  was consulted as reference and is not counted as an ad creative.
- Destination routes `/vendors`, `/pricing`, and `/auth/register` exist in the
  application. `/vendors` is the preferred explainer landing page; `/pricing` is
  reserved for higher-intent traffic.

## Ranked usable directions

| Rank | Source direction | Internal disposition | Why |
|---:|---|---|---|
| 1 | L3 — owner launch poster | **Draft with full rebuild** | Correct supply-side audience and closest match to the empty-marketplace need. Replace every outcome claim and the incorrect embedded `פה קריב`. |
| 2 | S5 — night falafel | **Subject/reference only** | Strong, simple mobile-vendor scene. Replace all consumer/open-now copy with truthful owner messaging. |
| 3 | S7 — jewelry maker | **Subject/reference only** | Clear local-maker category cue with relatively low visual clutter. Replace the consumer headline and add a single owner CTA. |
| 4 | L3 — free-draft copy variant | **Copy/layout only** | The real product flow supports a free private draft before payment, which is a stronger and safer proposition than promised growth. |

“Draft” here means reviewable copy and layout direction only. It does not mean the
source art is cleared, upload-ready, or approved for publication.

## Audit of every source creative

### Launch posters

| ID | File (short label) | Disposition | Findings that must be resolved |
|---|---|---|---|
| L1 | `...עגלת-קפה.png` | **Reject as-is; park consumer concept** | Claims a platform with nearby places, makers, home flavours, and community shopping while inventory is empty. Dense icon copy is illegible at mobile-ad size. The illustrated street/shop signs include questionable or malformed text. Logo and bottom benefit row sit in Story/Reel overlay zones. No image or depicted-person rights evidence. |
| L2 | `...גרסה-שניה.png` | **Reject as-is; park consumer concept** | Same empty-marketplace mismatch. Chalkboard wording reads awkwardly (`תומכים מקומיים בונים קהילה`; expected wording would require a rewrite). Small bullet copy and embedded signs will not survive feed crops. Top logo is unsafe for full-screen placement. No rights evidence. |
| L3 | `...גרסה-שלישית.png` | **Rebuild for owner draft** | `העסק שלכם מגיע בדיוק ללקוחות הנכונים`, `יותר חשיפה יותר לקוחות`, and growth language are unsupported outcome claims. An illustrated sign says `פה קריב` instead of `פה קרוב`. CTA sits too low for full-screen overlays. Depicted people/business and art provenance are undocumented. Preserve only the owner-oriented idea and brand palette. |

### Story creatives

| ID | File (short label) | Disposition | Findings that must be resolved |
|---|---|---|---|
| S1 | `...אוכל-טוב-תל-אביב...png` | **Park** | Promises nearby carts/businesses despite empty inventory and narrows the proposition to Tel Aviv without a campaign decision. Numerous handwritten/map notes are too small, awkward, or illegible. No single CTA; top/bottom elements are unsafe; no rights evidence. |
| S2 | `...אוכל-טעים-קרוב...png` | **Park** | Consumer discovery promise is presently unfulfillable. Speech-bubble and tote/sign copy are awkward and visually noisy; five tiny benefit lines will not be readable. No clean CTA or rights evidence. |
| S3 | `...חנות-פרחים...png` | **Park** | Empty-marketplace mismatch. Subline ends with incomplete `ממש ליד.` rather than a clean `ממש לידך`; a price board appears to say `אפרוחים 30`, and the street sign is malformed. No CTA; no rights evidence. |
| S4 | `...מאפייה...png` | **Park** | Empty-marketplace mismatch. Bottom five-item copy is too small; chalkboard copy is not reliably legible; the poster has no actionable CTA. A direct 4:5 or square crop would remove key content. No rights evidence. |
| S5 | `...פלאפל-לילה...png` | **Reference for owner variant only** | `מוכרים פתוחים ממש עכשיו` and “11 at night / hungry / solution” imply verified live inventory and current hours that do not exist. Top logo is in the overlay zone and there is no CTA. Keep only the mobile-vendor/night visual direction after rights clearance or redraw. |
| S6 | `...פרחים-מצב-רוח...png` | **Park** | Empty-marketplace mismatch. Subline again ends `ממש ליד.`; handwritten annotation is awkward, and the lower green text block is vulnerable to Story/Reel UI. No CTA or rights evidence. |
| S7 | `...שוק-תכשיטים...png` | **Reference for owner variant only** | Attractive local-maker subject, but the consumer claim cannot be supported while empty. Logo is too high for full-screen placement, there is no CTA, and source/model/illustration rights are undocumented. |

## Approved-for-internal-draft ad concepts

Use the same draft campaign token on every URL:
`utm_source=meta&utm_medium=paid_social&utm_campaign=il_owner_supply_launch_2026q3`.
The `utm_content` value below is the per-concept discriminator. These URLs are
planning evidence only and have not been added to Meta.

### 1. The business on the map — L3 rebuild

- **Primary Text:** יש לכם עסק קטן, דוכן או עסק נייד? ב״פה קרוב״ תוכלו ליצור
  טיוטת עסק בחינם, להוסיף מיקום ושעות פעילות ולבחור תקופת הופעה רק כשתהיו מוכנים.
- **Headline:** העסק שלכם על המפה
- **Description:** טיוטה בחינם. תשלום חד־פעמי לפי משך ההופעה.
- **CTA:** מידע נוסף (`LEARN_MORE`)
- **Audience intent:** High-consideration owners actively looking for local
  visibility; small shops, stalls, carts, and mobile businesses in Israel.
- **Placement/format:** Primary 1080×1350 Feed; adapted 1080×1080 Feed and
  1080×1920 Story. Do not use the original L3 file; rebuild with one owner scene,
  one headline, and no embedded performance promises.
- **Destination:** `https://pokarov.co.il/vendors`
- **UTM content:** `owner_map_l3_v1`
- **Rationale:** Directly addresses supply acquisition, explains actual editable
  listing fields, and avoids promising reach, customers, or growth.

### 2. Start with a free draft — L3 copy variant

- **Primary Text:** מתחילים בלי לשלם: פותחים חשבון, ממלאים את פרטי העסק ורואים
  תצוגה מקדימה פרטית. מאמתים את העסק ובוחרים תקופת הופעה רק אם מתאים.
- **Headline:** צרו טיוטת עסק בחינם
- **Description:** ללא עמלה על מכירות.
- **CTA:** הרשמה (`SIGN_UP`)
- **Audience intent:** High-intent owners comparing onboarding effort and cost.
- **Placement/format:** 1080×1350 Feed first; 1080×1080 and 1080×1920 adaptations.
  Use a clean three-step visual derived from the `/vendors` flow, not an illustrated
  consumer street full of implied listings.
- **Destination:** `https://pokarov.co.il/pricing`
- **UTM content:** `free_draft_process_v1`
- **Rationale:** Uses verifiable product facts: free private draft, business
  verification, and a one-time duration purchase. It does not imply marketplace
  demand or guaranteed results.

### 3. Mobile business location and hours — S5 visual reference

- **Primary Text:** עגלת קפה, דוכן אוכל או עסק שמחליף מיקום? ב״פה קרוב״ אפשר
  לעדכן מיקום ושעות פעילות, כדי שלקוחות יוכלו לראות מתי ואיפה אתם פתוחים.
- **Headline:** מיקום ושעות במקום אחד
- **Description:** לעסקים קטנים, דוכנים ועסקים ניידים.
- **CTA:** מידע נוסף (`LEARN_MORE`)
- **Audience intent:** Owners of carts, stalls, pop-ups, markets, and mobile food
  businesses with location/hours management needs.
- **Placement/format:** 1080×1920 Story/Reel-safe master; rebuilt 1080×1350 and
  1080×1080 feed versions. Preserve a night-stall subject only after rights
  clearance or commission a replacement image. Remove “open now” and time-of-day
  promises from the artwork.
- **Destination:** `https://pokarov.co.il/vendors`
- **UTM content:** `mobile_hours_s5_v1`
- **Rationale:** Converts the strongest visual into a truthful feature-led owner
  message and avoids pretending the platform already contains open businesses.

### 4. A place for local makers — S7 visual reference

- **Primary Text:** מעצבים, אופים, יוצרים או מוכרים מקומיים? צרו פרופיל עסק עם
  תמונות, קטגוריה, שעות ומיקום — ובחרו את משך ההופעה שמתאים לכם.
- **Headline:** מקום ליוצרים מקומיים
- **Description:** מיום אחד ועד 12 חודשים.
- **CTA:** מידע נוסף (`LEARN_MORE`)
- **Audience intent:** Local makers and market sellers who need a simple public
  listing rather than e-commerce or commission-based sales.
- **Placement/format:** 1080×1350 Feed master with 1080×1080 and 1080×1920
  adaptations. Keep a single maker/product focal point; remove all consumer
  discovery copy from S7.
- **Destination:** `https://pokarov.co.il/vendors`
- **UTM content:** `local_makers_s7_v1`
- **Rationale:** Expands supply beyond food while accurately describing listing
  fields and duration choice. It makes no sales, reach, or customer guarantee.

## Production specifications (for a later cleared rebuild)

Meta currently recommends vertical `4:5` for Feed and `9:16` for Stories/Reels;
photos may use `1:1` or `4:5`. Meta also recommends keeping full-screen key
elements in the safe zone and keeping image copy simple. See Meta's
[tailored-campaign creative guidance](https://www.facebook.com/business/ads/automation/tailored-campaigns),
[Reels guidance](https://www.facebook.com/business/ads/facebook-instagram-reels-ads),
and [photo-ad guidance](https://www.facebook.com/business/ads/photo-ad-format).

| Output | Canvas | Internal layout guardrail | Source treatment |
|---|---:|---|---|
| Feed portrait | 1080×1350 (4:5) | Keep logo/headline/subject inside 96 px side margins; reserve the bottom 140 px from critical text. One headline, one focal point, no tiny benefit row. | **Rebuild**, not center-crop: converting the 9:16 source to 4:5 removes too much vertical content. |
| Feed square | 1080×1080 (1:1) | Keep critical content inside a 96 px perimeter; use a shorter headline and let Meta render the CTA button. | **Recompose** from cleared layers or redraw; do not crop the flattened source poster. |
| Story/Reel | 1080×1920 (9:16) | Conservative review zone: no critical text in the top 250 px or bottom 340 px; keep key RTL text away from the right-side Reels control rail. Validate in Meta placement preview before approval. | The 941×1672 source is the correct ratio but requires a 1.148× upscale. That is acceptable only for an internal mockup; commission/export a native-resolution master for publication. |

Every review export must have a conspicuous diagonal watermark:
`DRAFT — NOT APPROVED FOR PUBLICATION`. Do not bake destination URLs into the art;
use the Meta CTA and tracked destination field. Keep detailed value propositions in
Primary Text rather than in small embedded poster copy.

## Claims and evidence rules

Remove or substantiate before any publication:

- Guaranteed or implied results: “the right customers”, “more exposure”, “more
  customers”, “growth starts here”.
- Inventory/status claims while empty: “open now”, “near you”, “everything is
  close”, “places you love”, and depictions that imply real listed businesses.
- Any invented price, address, testimonial, shop sign, or operating-hours detail.
- Any photograph/illustration depicting a person, property, or business without a
  recorded commercial-use source and applicable release.

Safe factual territory, subject to a final landing-page check: private free draft,
business verification, profile fields (photos/category/location/hours), one-time
duration purchase, no sales commission, and duration choices from one day through
12 months.

## Daniel-only approval gate

Before a later operator creates anything in Meta, Daniel must explicitly approve:

1. the final Hebrew copy and destination;
2. rights/provenance evidence or replacement creative for each image;
3. native-resolution exports and placement previews;
4. the actual campaign objective, audience, budget, schedule, tracking, Page, and
   Instagram identity.

Until then: **DRAFT / NOT APPROVED FOR PUBLICATION**.
