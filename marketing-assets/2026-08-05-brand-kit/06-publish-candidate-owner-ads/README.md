# DAN-133 publish-candidate owner ad creatives

Status: publish-candidate drafts for Daniel review only. Final publication,
Meta upload, activation, budget, schedule, audience selection, and spend remain
Daniel-only approval gates.

## Scope

This package rebuilds the four DAN-131 owner-acquisition concepts with
rights-safe repository assets only:

- `owner-map`: `העסק שלכם על המפה`
- `free-draft`: `צרו טיוטת עסק בחינם`
- `location-hours`: `מיקום ושעות במקום אחד`
- `local-makers`: `מקום ליוצרים מקומיים`

Each concept has native Meta-format exports:

- Feed portrait: `1080x1350`
- Feed square: `1080x1080`
- Story/Reel: `1080x1920`

## Folder contract

- `publish-candidates/`: unwatermarked PNGs suitable for final review.
- `draft-previews/`: matching PNGs with visible `DRAFT / NOT APPROVED`
  watermark.
- `manifest.json`: concept, format, dimensions, file path, SHA-256, UTM content
  token, measured critical bounds, and source-rights evidence for every output.

## Rights and claims

Inputs are limited to the repository-owned Pokarov logo, repository-bundled
OFL Hebrew fonts, and deterministic vector UI/map-like geometry authored in the
generator:

- `01-logos/pokarov-logo-main-transparent-2400x700.png`
- `03-fonts/Assistant-Hebrew-Variable-200-800.woff2`
- `03-fonts/Karantina-Hebrew-700.woff2`
- `source/build-dan133-publish-candidates.mjs`

No product screenshot, Google Maps tile, supplied illustrated
people/business/street-scene PNG, or undocumented third-party image is used.
Unsupported reach, guaranteed customer, live inventory, and open-now claims are
not used. Copy is limited to DAN-131 safe territory: free draft, profile fields,
location, hours, photos/category, one-time duration purchase, and duration
choices from one day through 12 months.

## Placement layout contract

- Feed portrait critical bounds: x=120–960, y=92–1200 (150px bottom clear).
- Feed square critical bounds: x=120–960, y=110–965 (at least 96px clear).
- Story/Reel critical bounds: x=120–820, y=270–1540 (250px top, 340px
  bottom, and 260px right-side UI rail clear).
- Every format is native rather than a resized placement. At a 360px viewport,
  all body, supporting-label, CTA, and domain text renders at 12.7px or larger;
  Story body text renders at 14.7px.

## Rebuild command

```bash
node marketing-assets/2026-08-05-brand-kit/source/build-dan133-publish-candidates.mjs
```

The generator writes PNG files and `manifest.json` deterministically from local
assets.
