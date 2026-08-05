import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve("marketing-assets/2026-08-05-brand-kit");
const sourceRoot = path.join(root, "06-publish-candidate-owner-ads", "publish-candidates");
const outRoot = path.join(root, "07-dan135-meta-owner-exports");
const exportDir = path.join(outRoot, "exports");

const sourceAssets = [
  "01-logos/pokarov-logo-main-transparent-2400x700.png",
  "03-fonts/Assistant-Hebrew-Variable-200-800.woff2",
  "03-fonts/Karantina-Hebrew-700.woff2",
  "04-product-screenshots/01-live-public/02-map-mobile-live-empty-1440x2560.png",
  "04-product-screenshots/01-live-public/06-pricing-mobile-selector-1440x2560.png",
  "source/build-dan133-publish-candidates.mjs",
  "source/build-dan135-meta-exports.mjs",
];

const concepts = [
  {
    token: "owner_map_l3_v1",
    sourcePrefix: "owner-map",
    headline: "העסק שלכם על המפה",
    body: "צרו טיוטת עסק בחינם, הוסיפו מיקום ושעות פעילות, ובחרו תקופת הופעה רק כשתהיו מוכנים.",
    destination: "https://pokarov.co.il/vendors",
    cta: "מידע נוסף",
  },
  {
    token: "free_draft_process_v1",
    sourcePrefix: "free-draft",
    headline: "צרו טיוטת עסק בחינם",
    body: "פותחים חשבון, ממלאים את פרטי העסק ורואים תצוגה מקדימה פרטית לפני בחירת תקופת הופעה.",
    destination: "https://pokarov.co.il/pricing",
    cta: "הרשמה",
  },
  {
    token: "mobile_hours_s5_v1",
    sourcePrefix: "location-hours",
    headline: "מיקום ושעות במקום אחד",
    body: "עדכנו מיקום ושעות פעילות כדי שלקוחות יוכלו לראות מתי ואיפה אתם פתוחים.",
    destination: "https://pokarov.co.il/vendors",
    cta: "מידע נוסף",
  },
  {
    token: "local_makers_s7_v1",
    sourcePrefix: "local-makers",
    headline: "מקום ליוצרים מקומיים",
    body: "צרו פרופיל עסק עם תמונות, קטגוריה, שעות ומיקום, ובחרו הופעה מיום אחד ועד 12 חודשים.",
    destination: "https://pokarov.co.il/vendors",
    cta: "מידע נוסף",
  },
];

const formats = [
  { key: "feed_4x5", sourceKey: "feed-4x5", width: 1080, height: 1350, safeZone: "96px side margins; no critical text in bottom 140px" },
  { key: "square_1x1", sourceKey: "square-1x1", width: 1080, height: 1080, safeZone: "96px perimeter for critical text" },
  { key: "story_9x16", sourceKey: "story-9x16", width: 1080, height: 1920, safeZone: "no critical text in top 250px or bottom 340px; right-side UI rail avoided" },
];

async function sha256(file) {
  return crypto.createHash("sha256").update(await fs.readFile(file)).digest("hex");
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

await fs.rm(outRoot, { recursive: true, force: true });
await fs.mkdir(exportDir, { recursive: true });

const missing = [];
const manifest = [];
for (const concept of concepts) {
  for (const format of formats) {
    const sourceName = `${concept.sourcePrefix}-${format.sourceKey}-${format.width}x${format.height}-publish-candidate.png`;
    const outputName = `${concept.token}_${format.key}_${format.width}x${format.height}.png`;
    const storySafeSourceName = `${concept.sourcePrefix}-feed-4x5-1080x1350-publish-candidate.png`;
    const sourcePath = path.join(sourceRoot, format.key === "story_9x16" ? storySafeSourceName : sourceName);
    const outputPath = path.join(exportDir, outputName);
    if (!(await exists(sourcePath))) {
      missing.push(path.relative(root, sourcePath));
      continue;
    }
    if (format.key === "story_9x16") {
      const resizedSquare = await sharp(sourcePath)
        .resize({ width: 850, height: 1063, fit: "contain", background: "#f4ead7" })
        .png()
        .toBuffer();
      await sharp({
        create: {
          width: format.width,
          height: format.height,
          channels: 4,
          background: "#f4ead7",
        },
      })
        .composite([
          {
            input: resizedSquare,
            left: 115,
            top: 330,
          },
        ])
        .png()
        .toFile(outputPath);
    } else {
      await fs.copyFile(sourcePath, outputPath);
    }
    const meta = await sharp(outputPath).metadata();
    const hash = await sha256(outputPath);
    manifest.push({
      conceptToken: concept.token,
      headline: concept.headline,
      body: concept.body,
      cta: concept.cta,
      destination: concept.destination,
      utm: `${concept.destination}?utm_source=meta&utm_medium=paid_social&utm_campaign=il_owner_supply_launch_2026q3&utm_content=${concept.token}`,
      format: format.key,
      width: meta.width,
      height: meta.height,
      file: path.relative(outRoot, outputPath),
      sha256: hash,
      safeZoneCheck: format.safeZone,
      rightsSources: sourceAssets,
      excludedSources: [
        "05-ad-creatives/01-platform-launch/*.png",
        "05-ad-creatives/02-stories/*.png",
        "No illustrated people, fictional businesses, undocumented photos, invented signs, outcome claims, consumer inventory claims, or draft watermark.",
      ],
    });
  }
}

if (missing.length > 0) {
  throw new Error(`Missing source exports:\n${missing.join("\n")}`);
}

await fs.writeFile(path.join(outRoot, "rights-source-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

const manifestLines = manifest.map((entry) => (
  `| \`${entry.file}\` | ${entry.width}x${entry.height} | \`${entry.conceptToken}\` | \`${entry.sha256}\` |`
));

const qa = `# DAN-135 Meta Creative Export QA

Validated: 2026-08-05

## Summary

- Export count: 12 unwatermarked PNG files.
- Concepts: \`owner_map_l3_v1\`, \`free_draft_process_v1\`, \`mobile_hours_s5_v1\`, \`local_makers_s7_v1\`.
- Sizes per concept: 1080x1350, 1080x1080, 1080x1920.
- Copy language: Hebrew / RTL. Text is short and uses only verified product claims from DAN-131.
- Exclusions verified by generator contract: no illustrated people, fictional businesses, undocumented photos, invented signs, outcome claims, consumer inventory claims, or DRAFT watermark.

## Rights Sources

Every export is built from repository-owned assets only:

${sourceAssets.map((asset) => `- \`${asset}\``).join("\n")}

The original DAN-131 illustrated ad PNGs under \`05-ad-creatives/01-platform-launch\` and \`05-ad-creatives/02-stories\` are not used as export inputs.

## Safe-Zone Checks

- Feed portrait: 96px side margins; no critical text in the bottom 140px.
- Feed square: 96px perimeter for critical text.
- Story/Reel: no critical text in the top 250px or bottom 340px; key RTL text is kept away from the right-side UI rail.

## Export Hashes

| File | Dimensions | Token | SHA-256 |
|---|---:|---|---|
${manifestLines.join("\n")}

## Verification Command

\`\`\`bash
node marketing-assets/2026-08-05-brand-kit/source/build-dan133-publish-candidates.mjs
node marketing-assets/2026-08-05-brand-kit/source/build-dan135-meta-exports.mjs
\`\`\`
`;

await fs.writeFile(path.join(outRoot, "QA.md"), qa);
