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
- `manifest.json`: concept, format, dimensions, file path, UTM content token,
  and source-rights note for every output.

## Rights and claims

Inputs are limited to repository-owned Pokarov brand assets, bundled Hebrew
fonts, and truthful product UI screenshots from the existing brand kit:

- `01-logos/pokarov-logo-main-transparent-2400x700.png`
- `03-fonts/Assistant-Hebrew-Variable-200-800.woff2`
- `03-fonts/Karantina-Hebrew-700.woff2`
- `04-product-screenshots/01-live-public/02-map-mobile-live-empty-1440x2560.png`
- `04-product-screenshots/01-live-public/06-pricing-mobile-selector-1440x2560.png`

The supplied illustrated people/business/street-scene PNG ads are not used.
Unsupported reach, guaranteed customer, live inventory, and open-now claims are
not used. Copy is limited to DAN-131 safe territory: free draft, profile fields,
location, hours, photos/category, business verification, one-time duration
purchase, and duration choices from one day through 12 months.

## Rebuild command

```bash
node marketing-assets/2026-08-05-brand-kit/source/build-dan133-publish-candidates.mjs
```

The generator writes PNG files and `manifest.json` deterministically from local
assets.
