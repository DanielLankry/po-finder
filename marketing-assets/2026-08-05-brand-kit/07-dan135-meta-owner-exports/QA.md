# DAN-135 Meta Creative Export QA

Validated: 2026-08-05

## Summary

- Export count: 12 unwatermarked PNG files.
- Concepts: `owner_map_l3_v1`, `free_draft_process_v1`, `mobile_hours_s5_v1`, `local_makers_s7_v1`.
- Sizes per concept: 1080x1350, 1080x1080, 1080x1920.
- Copy language: Hebrew / RTL. Text is short and uses only verified product claims from DAN-131.
- Exclusions verified by generator contract: no illustrated people, fictional businesses, undocumented photos, invented signs, outcome claims, consumer inventory claims, or DRAFT watermark.

## Rights Sources

Every export is built from repository-owned assets only:

- `01-logos/pokarov-logo-main-transparent-2400x700.png`
- `03-fonts/Assistant-Hebrew-Variable-200-800.woff2`
- `03-fonts/Karantina-Hebrew-700.woff2`
- `04-product-screenshots/01-live-public/02-map-mobile-live-empty-1440x2560.png`
- `04-product-screenshots/01-live-public/06-pricing-mobile-selector-1440x2560.png`
- `source/build-dan133-publish-candidates.mjs`
- `source/build-dan135-meta-exports.mjs`

The original DAN-131 illustrated ad PNGs under `05-ad-creatives/01-platform-launch` and `05-ad-creatives/02-stories` are not used as export inputs.

## Safe-Zone Checks

- Feed portrait: 96px side margins; no critical text in the bottom 140px.
- Feed square: 96px perimeter for critical text.
- Story/Reel: no critical text in the top 250px or bottom 340px; key RTL text is kept away from the right-side UI rail.

## Export Hashes

| File | Dimensions | Token | SHA-256 |
|---|---:|---|---|
| `exports/owner_map_l3_v1_feed_4x5_1080x1350.png` | 1080x1350 | `owner_map_l3_v1` | `ecf621c45fd180fd3e020545b599b7f68c02cf2587f2f61bb1c7de711e13e306` |
| `exports/owner_map_l3_v1_square_1x1_1080x1080.png` | 1080x1080 | `owner_map_l3_v1` | `7d4422c761d5e807938ebef15f9505e729eb6b9d796946d63bf110418dfcffa7` |
| `exports/owner_map_l3_v1_story_9x16_1080x1920.png` | 1080x1920 | `owner_map_l3_v1` | `08017a0fceb3a10c161e5523e50c59a29c27eb7e4173e564087c0f4d684dcbdf` |
| `exports/free_draft_process_v1_feed_4x5_1080x1350.png` | 1080x1350 | `free_draft_process_v1` | `4b305bee854bc1d1075ac857ecbc25d14d0429fd8f0b9358557dc020b4158ce3` |
| `exports/free_draft_process_v1_square_1x1_1080x1080.png` | 1080x1080 | `free_draft_process_v1` | `7eb8f34a1e00a72e55fab25f360e136b18244cd56fdaf0db64ab58f32bf2ecc9` |
| `exports/free_draft_process_v1_story_9x16_1080x1920.png` | 1080x1920 | `free_draft_process_v1` | `79411f243b041e8ee48a0f8a2bcd49298f0f2908d280eb0ef0addb951df067a4` |
| `exports/mobile_hours_s5_v1_feed_4x5_1080x1350.png` | 1080x1350 | `mobile_hours_s5_v1` | `354fe8d367dc8573798bac41dc5c6404cc7fb67951d42bcfcc56d83a4f309210` |
| `exports/mobile_hours_s5_v1_square_1x1_1080x1080.png` | 1080x1080 | `mobile_hours_s5_v1` | `9c0dd7d68dda55073b47a2590668e7fefc11b362001acfb0112df061aa9dd84b` |
| `exports/mobile_hours_s5_v1_story_9x16_1080x1920.png` | 1080x1920 | `mobile_hours_s5_v1` | `fe61c48772ea0e24945bdfea6ebba86394d5f050af8adb9fedb7ab7a479134ba` |
| `exports/local_makers_s7_v1_feed_4x5_1080x1350.png` | 1080x1350 | `local_makers_s7_v1` | `49be93224f4747cb8d36e8bb8e12b764e3c5b1660357eb44e771da1fea56c303` |
| `exports/local_makers_s7_v1_square_1x1_1080x1080.png` | 1080x1080 | `local_makers_s7_v1` | `a645a81545ad6dd869e09d40ff505b4e8d41d7b82ff8fc22e41866b465297134` |
| `exports/local_makers_s7_v1_story_9x16_1080x1920.png` | 1080x1920 | `local_makers_s7_v1` | `a5702d916085940b02f292cc319455b2ad7bc05760d4471de9ea282a80e5b473` |

## Verification Command

```bash
node marketing-assets/2026-08-05-brand-kit/source/build-dan133-publish-candidates.mjs
node marketing-assets/2026-08-05-brand-kit/source/build-dan135-meta-exports.mjs
```
