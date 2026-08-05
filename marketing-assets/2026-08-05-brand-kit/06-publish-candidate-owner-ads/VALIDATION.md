# DAN-133 validation

Validated on 2026-08-05.

## Checks

- File count: 12 publish candidates, 12 draft previews, 1 manifest.
- Required dimensions present for every concept: `1080x1350`, `1080x1080`,
  `1080x1920`.
- Publish candidates are unwatermarked and segregated under
  `publish-candidates/`.
- Preview copies are watermarked and segregated under `draft-previews/`.
- Hebrew copy is RTL, short, and avoids unsupported reach/customer/open-now/live
  marketplace claims.
- Story/Reel layouts reserve large top and bottom safe zones for Meta UI.
- No supplied illustrated people/business scene PNGs are referenced by the
  generator or manifest.

## Commands

```bash
node marketing-assets/2026-08-05-brand-kit/source/build-dan133-publish-candidates.mjs
node - <<'NODE'
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const root = "marketing-assets/2026-08-05-brand-kit/06-publish-candidate-owner-ads";
(async () => {
  const files = fs.readdirSync(path.join(root, "publish-candidates")).concat(
    fs.readdirSync(path.join(root, "draft-previews"))
  );
  console.log({ pngCount: files.filter((file) => file.endsWith(".png")).length });
  for (const rel of JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8")).map((entry) => entry.file)) {
    const meta = await sharp(path.join(root, rel)).metadata();
    if (meta.width === undefined || meta.height === undefined) throw new Error(rel);
    console.log(`${rel}: ${meta.width}x${meta.height}`);
  }
})();
NODE
```
