import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve("marketing-assets/2026-08-05-brand-kit");
const outRoot = path.join(root, "06-publish-candidate-owner-ads");
const publishDir = path.join(outRoot, "publish-candidates");
const previewDir = path.join(outRoot, "draft-previews");

const logo = path.resolve(root, "01-logos/pokarov-logo-main-transparent-2400x700.png");
const fontAssistant = path.resolve(root, "03-fonts/Assistant-Hebrew-Variable-200-800.woff2");
const fontKarantina = path.resolve(root, "03-fonts/Karantina-Hebrew-700.woff2");

const formats = [
  {
    key: "feed-4x5",
    w: 1080,
    h: 1350,
    safeZone: "96px side margins; no critical content in bottom 140px",
    criticalBounds: { xMin: 120, xMax: 960, yMin: 92, yMax: 1200 },
  },
  {
    key: "square-1x1",
    w: 1080,
    h: 1080,
    safeZone: "96px perimeter for critical content",
    criticalBounds: { xMin: 120, xMax: 960, yMin: 110, yMax: 965 },
  },
  {
    key: "story-9x16",
    w: 1080,
    h: 1920,
    safeZone: "250px top, 340px bottom, 120px left, and 260px right UI-rail clearance",
    criticalBounds: { xMin: 120, xMax: 820, yMin: 270, yMax: 1540 },
  },
];

const concepts = [
  {
    id: "owner-map",
    headline: "העסק שלכם על המפה",
    kicker: "לעסקים קטנים, דוכנים ועסקים ניידים",
    body: "צרו טיוטת עסק בחינם, הוסיפו מיקום ושעות פעילות, ובחרו תקופת הופעה רק כשתהיו מוכנים.",
    cta: "מידע נוסף",
    token: "owner_map_l3_v1",
    accent: "#d46d45",
    art: "map",
  },
  {
    id: "free-draft",
    headline: "צרו טיוטת עסק בחינם",
    kicker: "מתחילים בלי לשלם",
    body: "פותחים חשבון, ממלאים את פרטי העסק ורואים תצוגה מקדימה פרטית לפני בחירת תקופת הופעה.",
    cta: "הרשמה",
    token: "free_draft_process_v1",
    accent: "#2f7d5b",
    art: "steps",
  },
  {
    id: "location-hours",
    headline: "מיקום ושעות במקום אחד",
    kicker: "לעגלה, דוכן או עסק שמחליף מיקום",
    body: "עדכנו מיקום ושעות פעילות כדי שלקוחות יוכלו לראות מתי ואיפה אתם פתוחים.",
    cta: "מידע נוסף",
    token: "mobile_hours_s5_v1",
    accent: "#3b6f8f",
    art: "hours",
  },
  {
    id: "local-makers",
    headline: "מקום ליוצרים מקומיים",
    kicker: "מעצבים, אופים, יוצרים ומוכרים מקומיים",
    body: "צרו פרופיל עסק עם תמונות, קטגוריה, שעות ומיקום, ובחרו הופעה מיום אחד ועד 12 חודשים.",
    cta: "מידע נוסף",
    token: "local_makers_s7_v1",
    accent: "#8c5a3c",
    art: "profile",
  },
];

const esc = (value) => String(value).replace(/[&<>\"]/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
}[character]));

const dataUri = async (file) => `data:image/${path.extname(file).slice(1).replace("jpg", "jpeg")};base64,${(await fs.readFile(file)).toString("base64")}`;
const fontUri = async (file) => `data:font/woff2;base64,${(await fs.readFile(file)).toString("base64")}`;
const sha256 = async (file) => crypto.createHash("sha256").update(await fs.readFile(file)).digest("hex");

function wrapWords(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function textBlock(lines, x, y, size, weight, fill, family, lineHeight) {
  return `<text x="${x}" y="${y}" text-anchor="end" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}">${lines.map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${esc(line)}</tspan>`).join("")}</text>`;
}

function pin(x, y, accent) {
  return `<path d="M${x} ${y + 40} C${x - 38} ${y + 4} ${x - 30} ${y - 48} ${x} ${y - 48} C${x + 30} ${y - 48} ${x + 38} ${y + 4} ${x} ${y + 40}Z" fill="${accent}" stroke="#18392d" stroke-width="5"/><circle cx="${x}" cy="${y - 16}" r="10" fill="#fffaf0"/>`;
}

function artPanel(concept, box) {
  const { x, y, w, h } = box;
  const innerX = x + 34;
  const innerY = y + 30;
  const innerW = w - 68;
  const innerH = h - 60;
  const labelSize = box.story ? 42 : 40;
  const common = `<rect x="${x + 10}" y="${y + 12}" width="${w}" height="${h}" rx="26" fill="#18392d"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="26" fill="#fffaf0" stroke="#18392d" stroke-width="6"/>`;

  if (concept.art === "map") {
    return `${common}<g fill="none" stroke-linecap="round">
      <path d="M${innerX - 20} ${innerY + innerH * 0.78} C${innerX + innerW * 0.22} ${innerY + innerH * 0.1}, ${innerX + innerW * 0.52} ${innerY + innerH * 1.08}, ${innerX + innerW + 20} ${innerY + innerH * 0.25}" stroke="#2f7d5b" stroke-width="18" opacity=".28"/>
      <path d="M${innerX + innerW * 0.1} ${innerY - 15} C${innerX + innerW * 0.32} ${innerY + innerH * 0.42}, ${innerX + innerW * 0.66} ${innerY + innerH * 0.28}, ${innerX + innerW * 0.92} ${innerY + innerH + 15}" stroke="#d46d45" stroke-width="14" opacity=".25"/>
      <path d="M${innerX - 10} ${innerY + innerH * 0.35} C${innerX + innerW * 0.38} ${innerY + innerH * 0.55}, ${innerX + innerW * 0.58} ${innerY + innerH * 0.15}, ${innerX + innerW + 10} ${innerY + innerH * 0.58}" stroke="#18392d" stroke-width="9" opacity=".2"/>
    </g>${pin(innerX + innerW * 0.26, innerY + innerH * 0.58, concept.accent)}${pin(innerX + innerW * 0.63, innerY + innerH * 0.38, "#2f7d5b")}<rect x="${innerX + innerW - 255}" y="${innerY + 8}" width="245" height="58" rx="29" fill="#f4ead7" stroke="#18392d" stroke-width="4"/>${textBlock(["מיקום העסק"], innerX + innerW - 30, innerY + 48, labelSize, 850, "#18392d", "Assistant", 44)}`;
  }

  if (concept.art === "steps") {
    const gap = 18;
    const cardW = (innerW - gap * 2) / 3;
    const labels = ["פרטים", "תצוגה", "תקופה"];
    return `${common}${labels.map((label, index) => {
      const cardX = innerX + (labels.length - 1 - index) * (cardW + gap);
      return `<rect x="${cardX}" y="${innerY}" width="${cardW}" height="${innerH}" rx="20" fill="${index === 1 ? "#f4ead7" : "#fffaf0"}" stroke="#18392d" stroke-width="4"/><circle cx="${cardX + cardW / 2}" cy="${innerY + innerH * 0.34}" r="31" fill="${concept.accent}" stroke="#18392d" stroke-width="4"/><text x="${cardX + cardW / 2}" y="${innerY + innerH * 0.34 + 12}" text-anchor="middle" font-family="Assistant" font-size="34" font-weight="900" fill="#fffaf0">${index + 1}</text><text x="${cardX + cardW / 2}" y="${innerY + innerH * 0.76}" text-anchor="middle" font-family="Assistant" font-size="${labelSize}" font-weight="850" fill="#18392d">${label}</text>`;
    }).join("")}`;
  }

  if (concept.art === "hours") {
    const split = innerX + innerW * 0.5;
    return `${common}<rect x="${innerX}" y="${innerY}" width="${innerW * 0.46}" height="${innerH}" rx="20" fill="#f4ead7" stroke="#18392d" stroke-width="4"/><rect x="${split + 18}" y="${innerY}" width="${innerW * 0.46}" height="${innerH}" rx="20" fill="#e5efe8" stroke="#18392d" stroke-width="4"/>${pin(innerX + innerW * 0.23, innerY + innerH * 0.48, concept.accent)}${textBlock(["מיקום"], split + innerW * 0.44, innerY + 58, labelSize, 850, "#18392d", "Assistant", 44)}<circle cx="${split + innerW * 0.23}" cy="${innerY + innerH * 0.56}" r="48" fill="#fffaf0" stroke="#18392d" stroke-width="5"/><path d="M${split + innerW * 0.23} ${innerY + innerH * 0.56} l0 -27 M${split + innerW * 0.23} ${innerY + innerH * 0.56} l24 15" stroke="#18392d" stroke-width="7" stroke-linecap="round"/>${textBlock(["שעות"], split + innerW * 0.44, innerY + 58, labelSize, 850, "#18392d", "Assistant", 44)}`;
  }

  const labels = ["תמונות", "קטגוריה", "שעות", "מיקום"];
  const chipW = (innerW - 22) / 2;
  const chipH = (innerH - 20) / 2;
  return `${common}${labels.map((label, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const chipX = innerX + column * (chipW + 22);
    const chipY = innerY + row * (chipH + 20);
    return `<rect x="${chipX}" y="${chipY}" width="${chipW}" height="${chipH}" rx="20" fill="${index === 0 || index === 3 ? "#f4ead7" : "#fffaf0"}" stroke="#18392d" stroke-width="4"/><circle cx="${chipX + chipW - 42}" cy="${chipY + chipH / 2}" r="13" fill="${concept.accent}"/><text x="${chipX + chipW - 72}" y="${chipY + chipH / 2 + 13}" text-anchor="end" font-family="Assistant" font-size="${labelSize}" font-weight="850" fill="#18392d">${label}</text>`;
  }).join("")}`;
}

function layoutFor(format) {
  if (format.key === "story-9x16") {
    return {
      story: true,
      logo: { x: 120, y: 270, w: 260 },
      textRight: 820,
      kickerY: 430,
      kickerSize: 38,
      headlineY: 555,
      headlineSize: 82,
      headlineChars: 16,
      bodyY: 745,
      bodySize: 44,
      bodyChars: 27,
      panel: { x: 120, y: 1000, w: 700, h: 270, story: true },
      cta: { x: 120, y: 1340, w: 245, h: 94 },
      domain: { x: 120, y: 1520, size: 38 },
    };
  }
  if (format.key === "square-1x1") {
    return {
      story: false,
      logo: { x: 120, y: 110, w: 220 },
      textRight: 960,
      kickerY: 235,
      kickerSize: 38,
      headlineY: 345,
      headlineSize: 68,
      headlineChars: 17,
      bodyY: 470,
      bodySize: 40,
      bodyChars: 34,
      panel: { x: 120, y: 640, w: 840, h: 155, story: false },
      cta: { x: 120, y: 830, w: 220, h: 82 },
      domain: { x: 120, y: 955, size: 38 },
    };
  }
  return {
    story: false,
    logo: { x: 120, y: 92, w: 235 },
    textRight: 960,
    kickerY: 245,
    kickerSize: 38,
    headlineY: 365,
    headlineSize: 76,
    headlineChars: 17,
    bodyY: 515,
    bodySize: 42,
    bodyChars: 34,
    panel: { x: 120, y: 735, w: 840, h: 255, story: false },
    cta: { x: 120, y: 1045, w: 230, h: 88 },
    domain: { x: 120, y: 1190, size: 38 },
  };
}

async function svgFor(concept, format, draft, assets) {
  const layout = layoutFor(format);
  const logoHeight = Math.round(layout.logo.w * 0.292);
  const kickerLines = layout.story && concept.id === "local-makers"
    ? wrapWords(concept.kicker, 23)
    : [concept.kicker];
  const headlineLines = wrapWords(concept.headline, layout.headlineChars);
  const bodyLines = wrapWords(concept.body, layout.bodyChars);
  const ctaTextX = layout.cta.x + layout.cta.w / 2;
  const ctaTextY = layout.cta.y + layout.cta.h * 0.66;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${format.w}" height="${format.h}" viewBox="0 0 ${format.w} ${format.h}">
<defs><style>@font-face{font-family:Assistant;src:url("${assets.assistant}") format("woff2");font-weight:200 800}@font-face{font-family:Karantina;src:url("${assets.karantina}") format("woff2");font-weight:700}</style></defs>
<rect width="100%" height="100%" fill="#f4ead7"/>
<g opacity=".18" fill="none" stroke-linecap="round"><path d="M-40 ${format.h * 0.77} C230 ${format.h * 0.54}, 490 ${format.h * 0.94}, 1130 ${format.h * 0.3}" stroke="#2f7d5b" stroke-width="6"/><path d="M100 -50 C310 250, 730 430, 1180 325" stroke="#d46d45" stroke-width="6"/><circle cx="920" cy="${format.h * 0.19}" r="12" fill="#d46d45"/></g>
<image href="${assets.logo}" x="${layout.logo.x}" y="${layout.logo.y}" width="${layout.logo.w}" height="${logoHeight}" preserveAspectRatio="xMidYMid meet"/>
${textBlock(kickerLines, layout.textRight, layout.kickerY, layout.kickerSize, 800, concept.accent, "Assistant", 46)}
${textBlock(headlineLines, layout.textRight, layout.headlineY, layout.headlineSize, 700, "#18392d", "Karantina", layout.headlineSize * 0.86)}
${textBlock(bodyLines, layout.textRight, layout.bodyY, layout.bodySize, 760, "#18392d", "Assistant", layout.bodySize * 1.24)}
${artPanel(concept, layout.panel)}
<rect x="${layout.cta.x + 10}" y="${layout.cta.y + 10}" width="${layout.cta.w}" height="${layout.cta.h}" fill="#18392d"/>
<rect x="${layout.cta.x}" y="${layout.cta.y}" width="${layout.cta.w}" height="${layout.cta.h}" fill="${concept.accent}" stroke="#18392d" stroke-width="5"/>
<text x="${ctaTextX}" y="${ctaTextY}" text-anchor="middle" font-family="Assistant" font-size="42" font-weight="900" fill="#fffaf0">${esc(concept.cta)}</text>
<text x="${layout.domain.x}" y="${layout.domain.y}" font-family="Assistant" font-size="${layout.domain.size}" font-weight="800" fill="#18392d">pokarov.co.il</text>
${draft ? `<g transform="translate(${format.w / 2} ${format.h / 2}) rotate(-28)" opacity=".22"><text x="0" y="-10" text-anchor="middle" font-family="Assistant" font-size="${layout.story ? 86 : 72}" font-weight="900" fill="#18392d">DRAFT</text><text x="0" y="${layout.story ? 78 : 62}" text-anchor="middle" font-family="Assistant" font-size="${layout.story ? 52 : 42}" font-weight="900" fill="#18392d">NOT APPROVED</text></g>` : ""}
</svg>`;
}

await fs.mkdir(publishDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });

const assets = {
  logo: await dataUri(logo),
  assistant: await fontUri(fontAssistant),
  karantina: await fontUri(fontKarantina),
};

const manifest = [];
for (const concept of concepts) {
  for (const format of formats) {
    for (const draft of [false, true]) {
      const dir = draft ? previewDir : publishDir;
      const suffix = draft ? "-draft-preview" : "-publish-candidate";
      const fileName = `${concept.id}-${format.key}-${format.w}x${format.h}${suffix}.png`;
      const outputPath = path.join(dir, fileName);
      const svg = await svgFor(concept, format, draft, assets);
      await sharp(Buffer.from(svg)).png().toFile(outputPath);
      manifest.push({
        concept: concept.id,
        headline: concept.headline,
        format: format.key,
        width: format.w,
        height: format.h,
        draftPreview: draft,
        file: path.relative(outRoot, outputPath),
        sha256: await sha256(outputPath),
        utmContent: concept.token,
        safeZoneCheck: format.safeZone,
        criticalBounds: format.criticalBounds,
        rightsSafeSources: [
          "01-logos/pokarov-logo-main-transparent-2400x700.png",
          "03-fonts/Assistant-Hebrew-Variable-200-800.woff2 (OFL-1.1)",
          "03-fonts/Karantina-Hebrew-700.woff2 (OFL-1.1)",
          "source/build-dan133-publish-candidates.mjs (repository-authored vector UI/map-like geometry)",
        ],
        excludedSources: "No product screenshots, Google Maps content, illustrated people/business scenes, or undocumented third-party imagery.",
      });
    }
  }
}

await fs.writeFile(path.join(outRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
