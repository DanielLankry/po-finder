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
- Every placement is laid out natively. Recorded critical bounds satisfy the
  feed, square, and Story/Reel safe-zone contracts.
- Body/supporting-label/CTA/domain text remains at least 12.7px when the 1080px
  assets are viewed at 360 CSS pixels; Story body text renders at 14.7px.
- No product screenshot, Google Maps tile, supplied illustrated people/business
  scene PNG, or undocumented third-party imagery is referenced by the generator
  or manifest.
- Every one of the 24 manifest entries includes a SHA-256 that matches its PNG.

## Commands

```bash
node marketing-assets/2026-08-05-brand-kit/source/build-dan133-publish-candidates.mjs
node - <<'NODE'
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");
const sharp = require("sharp");
const root = "marketing-assets/2026-08-05-brand-kit/06-publish-candidate-owner-ads";
(async () => {
  const files = fs.readdirSync(path.join(root, "publish-candidates")).concat(
    fs.readdirSync(path.join(root, "draft-previews"))
  );
  console.log({ pngCount: files.filter((file) => file.endsWith(".png")).length });
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
  if (manifest.length !== 24) throw new Error(`Expected 24 entries, received ${manifest.length}`);
  for (const entry of manifest) {
    const file = path.join(root, entry.file);
    const meta = await sharp(file).metadata();
    if (meta.width !== entry.width || meta.height !== entry.height) throw new Error(`Dimension mismatch: ${entry.file}`);
    const hash = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
    if (hash !== entry.sha256) throw new Error(`Hash mismatch: ${entry.file}`);
    const bounds = entry.criticalBounds;
    if (entry.format === "feed-4x5" && (bounds.xMin < 96 || bounds.xMax > 984 || bounds.yMax > 1210)) throw new Error(`Feed safe-zone failure: ${entry.file}`);
    if (entry.format === "square-1x1" && (bounds.xMin < 96 || bounds.xMax > 984 || bounds.yMin < 96 || bounds.yMax > 984)) throw new Error(`Square safe-zone failure: ${entry.file}`);
    if (entry.format === "story-9x16" && (bounds.xMin < 120 || bounds.xMax > 820 || bounds.yMin < 250 || bounds.yMax > 1580)) throw new Error(`Story safe-zone failure: ${entry.file}`);
    console.log(`${entry.file}: ${meta.width}x${meta.height} ${hash}`);
  }
})();
NODE
```
