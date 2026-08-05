# DAN-135 Meta Creative Export QA

Validated: 2026-08-05

## Summary

- Export count: 12 unwatermarked PNG files.
- Concepts: `owner_map_l3_v1`, `free_draft_process_v1`, `mobile_hours_s5_v1`, `local_makers_s7_v1`.
- Sizes per concept: 1080x1350, 1080x1080, 1080x1920.
- Copy language: Hebrew / RTL. Text is short and uses only verified product claims from DAN-131.
- Exclusions verified by generator contract: no illustrated people, fictional businesses, undocumented photos, invented signs, outcome claims, consumer inventory claims, or DRAFT watermark.

## Rights Sources

Every export uses the repository-owned Pokarov logo, repository-bundled OFL
fonts, and deterministic vector UI/map-like geometry authored in the generator:

- `01-logos/pokarov-logo-main-transparent-2400x700.png`
- `03-fonts/Assistant-Hebrew-Variable-200-800.woff2`
- `03-fonts/Karantina-Hebrew-700.woff2`
- `source/build-dan133-publish-candidates.mjs`
- `source/build-dan135-meta-exports.mjs`

No product screenshot or third-party map tile is used. The original DAN-131
illustrated ad PNGs under `05-ad-creatives/01-platform-launch` and
`05-ad-creatives/02-stories` are not used as export inputs.

## Safe-Zone Checks

- Feed portrait critical bounds: x=120–960, y=92–1200; the bottom 150px is clear.
- Feed square critical bounds: x=120–960, y=110–965; the full 96px perimeter is clear.
- Story/Reel critical bounds: x=120–820, y=270–1540; the top 250px, bottom 340px, and right 260px UI rail are clear.
- Every placement is native. Body/supporting-label/CTA/domain text remains at least 12.7px at a 360px viewport; Story body text is 44px (14.7px at 360px).

## Export Hashes

| File | Dimensions | Token | SHA-256 |
|---|---:|---|---|
| `exports/owner_map_l3_v1_feed_4x5_1080x1350.png` | 1080x1350 | `owner_map_l3_v1` | `7054dc9a74076b7bad32a063ab45f4117f4e935d3e7b0947e984a2ca78a320c6` |
| `exports/owner_map_l3_v1_square_1x1_1080x1080.png` | 1080x1080 | `owner_map_l3_v1` | `b55c7e5ab1e2b1509f33f808edd5bf919589205fe7eacccd4fedcf0a2eb60255` |
| `exports/owner_map_l3_v1_story_9x16_1080x1920.png` | 1080x1920 | `owner_map_l3_v1` | `ce729365b4656838779bb00a80cec2f4aa41d950cd49d69db89a224b6edd0c3e` |
| `exports/free_draft_process_v1_feed_4x5_1080x1350.png` | 1080x1350 | `free_draft_process_v1` | `137edfcf62232b847751dea7f6c333ba3a859d17afa902fde299466905575599` |
| `exports/free_draft_process_v1_square_1x1_1080x1080.png` | 1080x1080 | `free_draft_process_v1` | `a8a78c43779999e4ad89ef0eb71871dc1d0f8492a114530a55282f33fe8248c4` |
| `exports/free_draft_process_v1_story_9x16_1080x1920.png` | 1080x1920 | `free_draft_process_v1` | `296fce4e2159ba70263ae4409127c1e519396545cd982e3a7376a1e553c223d0` |
| `exports/mobile_hours_s5_v1_feed_4x5_1080x1350.png` | 1080x1350 | `mobile_hours_s5_v1` | `4d95c96142181e2bdcd1dbe3f20aee14cca790de14b83a0579b3b436e6c2ed4c` |
| `exports/mobile_hours_s5_v1_square_1x1_1080x1080.png` | 1080x1080 | `mobile_hours_s5_v1` | `aa131b9aeaf3af201a07949aa5c6fef213f2c123d3e88aa07ea2c078e21d6df6` |
| `exports/mobile_hours_s5_v1_story_9x16_1080x1920.png` | 1080x1920 | `mobile_hours_s5_v1` | `24e80924dd2276309e5d908919a38db34b9ef7fb76aeaa6ba91e41027580b5f1` |
| `exports/local_makers_s7_v1_feed_4x5_1080x1350.png` | 1080x1350 | `local_makers_s7_v1` | `2ffb83cd3e5605b0548ba8969d67692b5ab8e75ed3e5d689c024f218748bb26f` |
| `exports/local_makers_s7_v1_square_1x1_1080x1080.png` | 1080x1080 | `local_makers_s7_v1` | `a6af5048c7149e1d7bcabbb5be6c3b980332fd098d3ec4ead5989c4876ee4ee4` |
| `exports/local_makers_s7_v1_story_9x16_1080x1920.png` | 1080x1920 | `local_makers_s7_v1` | `8d91966e5df8663de32936fe56178da335e0d06336f0fd14dbd4ca413ab79fc8` |

## Verification Command

```bash
node marketing-assets/2026-08-05-brand-kit/source/build-dan133-publish-candidates.mjs
node marketing-assets/2026-08-05-brand-kit/source/build-dan135-meta-exports.mjs
```
