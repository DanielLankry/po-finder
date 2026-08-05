import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve("marketing-assets/2026-08-05-brand-kit");
const outRoot = path.join(root, "06-publish-candidate-owner-ads");
const publishDir = path.join(outRoot, "publish-candidates");
const previewDir = path.join(outRoot, "draft-previews");

const logo = path.resolve(root, "01-logos/pokarov-logo-main-transparent-2400x700.png");
const mapShot = path.resolve(root, "04-product-screenshots/01-live-public/02-map-mobile-live-empty-1440x2560.png");
const pricingShot = path.resolve(root, "04-product-screenshots/01-live-public/06-pricing-mobile-selector-1440x2560.png");
const fontAssistant = path.resolve(root, "03-fonts/Assistant-Hebrew-Variable-200-800.woff2");
const fontKarantina = path.resolve(root, "03-fonts/Karantina-Hebrew-700.woff2");

const sizes = [
  { key: "feed-4x5", w: 1080, h: 1350 },
  { key: "square-1x1", w: 1080, h: 1080 },
  { key: "story-9x16", w: 1080, h: 1920 },
];

const concepts = [
  ["owner-map", "העסק שלכם על המפה", "לעסקים קטנים, דוכנים ועסקים ניידים", "צרו טיוטת עסק בחינם, הוסיפו מיקום ושעות פעילות, ובחרו תקופת הופעה רק כשתהיו מוכנים.", "מידע נוסף", mapShot, "owner_map_l3_v1", "#d46d45"],
  ["free-draft", "צרו טיוטת עסק בחינם", "מתחילים בלי לשלם", "פותחים חשבון, ממלאים את פרטי העסק ורואים תצוגה מקדימה פרטית לפני בחירת תקופת הופעה.", "הרשמה", pricingShot, "free_draft_process_v1", "#2f7d5b"],
  ["location-hours", "מיקום ושעות במקום אחד", "לעגלה, דוכן או עסק שמחליף מיקום", "עדכנו מיקום ושעות פעילות כדי שלקוחות יוכלו לראות מתי ואיפה אתם פתוחים.", "מידע נוסף", mapShot, "mobile_hours_s5_v1", "#3b6f8f"],
  ["local-makers", "מקום ליוצרים מקומיים", "מעצבים, אופים, יוצרים ומוכרים מקומיים", "צרו פרופיל עסק עם תמונות, קטגוריה, שעות ומיקום, ובחרו הופעה מיום אחד ועד 12 חודשים.", "מידע נוסף", pricingShot, "local_makers_s7_v1", "#8c5a3c"],
].map(([id, headline, kicker, body, cta, shot, token, accent]) => ({ id, headline, kicker, body, cta, shot, token, accent }));

const esc = (value) => String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
const dataUri = async (file) => `data:image/${path.extname(file).slice(1).replace("jpg", "jpeg")};base64,${(await fs.readFile(file)).toString("base64")}`;
const fontUri = async (file) => `data:font/woff2;base64,${(await fs.readFile(file)).toString("base64")}`;

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
  return `<text x="${x}" y="${y}" text-anchor="end" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}">${
    lines.map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${esc(line)}</tspan>`).join("")
  }</text>`;
}

async function svgFor(concept, size, draft, assets) {
  const story = size.h > 1500;
  const square = size.h === size.w;
  const top = story ? 230 : 88;
  const right = 84;
  const contentW = size.w - 168;
  const logoW = story ? 310 : 255;
  const headlineSize = story ? 86 : square ? 60 : 70;
  const bodySize = story ? 34 : 35;
  const panelY = story ? 1030 : square ? 548 : 690;
  const panelH = story ? 500 : square ? 330 : 410;
  const ctaY = story ? 1625 : square ? 950 : 1190;
  const phoneW = Math.round(panelH * 0.5625);
  const phoneX = size.w - right - 28 - phoneW;
  const factsX = phoneX - 54;
  const headlineLines = wrapWords(concept.headline, square ? 12 : 14);
  const bodyLines = wrapWords(concept.body, story ? 28 : 34);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size.w}" height="${size.h}" viewBox="0 0 ${size.w} ${size.h}">
<defs>
  <style>
    @font-face{font-family:Assistant;src:url("${assets.assistant}") format("woff2");font-weight:200 800}
    @font-face{font-family:Karantina;src:url("${assets.karantina}") format("woff2");font-weight:700}
  </style>
  <clipPath id="phone"><rect x="${phoneX}" y="${panelY + 28}" width="${phoneW}" height="${panelH - 56}" rx="34"/></clipPath>
</defs>
<rect width="100%" height="100%" fill="#f4ead7"/>
<g opacity=".22" fill="none" stroke-linecap="round">
  <path d="M-40 ${size.h * 0.75} C 210 ${size.h * 0.54}, 460 ${size.h * 0.92}, 1120 ${size.h * 0.28}" stroke="#2f7d5b" stroke-width="5"/>
  <path d="M120 -40 C 310 240, 730 420, 1180 330" stroke="#d46d45" stroke-width="5"/>
  <path d="M-20 ${size.h * 0.35} C 360 ${size.h * 0.22}, 540 ${size.h * 0.64}, 1140 ${size.h * 0.58}" stroke="#18392d" stroke-width="4"/>
  <circle cx="190" cy="${size.h * 0.74}" r="9" fill="#2f7d5b"/>
  <circle cx="900" cy="${size.h * 0.20}" r="11" fill="#d46d45"/>
  <circle cx="735" cy="${size.h * 0.84}" r="8" fill="#18392d"/>
</g>
<image href="${assets.logo}" x="84" y="${top}" width="${logoW}" height="${Math.round(logoW * 0.292)}" preserveAspectRatio="xMidYMid meet"/>
<rect x="${size.w - right - 520}" y="${top + (story ? 150 : 105)}" width="520" height="${story ? 72 : 62}" fill="#fff7e8" stroke="#18392d" stroke-width="4"/>
${textBlock([concept.kicker], size.w - right - 22, top + (story ? 198 : 146), story ? 34 : 28, 800, concept.accent, "Assistant", 40)}
${textBlock(headlineLines, size.w - right, top + (story ? 335 : 250), headlineSize, 700, "#18392d", "Karantina", headlineSize * 0.84)}
${textBlock(bodyLines, size.w - right, top + (story ? 565 : square ? 412 : 465), bodySize, 760, "#18392d", "Assistant", bodySize * 1.22)}
<rect x="98" y="${panelY + 14}" width="${contentW}" height="${panelH}" fill="#18392d"/>
<rect x="84" y="${panelY}" width="${contentW}" height="${panelH}" fill="#fffaf0" stroke="#18392d" stroke-width="6"/>
<rect x="${phoneX + 8}" y="${panelY + 36}" width="${phoneW}" height="${panelH - 56}" rx="34" fill="${concept.accent}"/>
<rect x="${phoneX}" y="${panelY + 28}" width="${phoneW}" height="${panelH - 56}" rx="34" fill="#e8d9bd" stroke="#18392d" stroke-width="5"/>
<image href="${assets[concept.shot]}" x="${phoneX}" y="${panelY + 28}" width="${phoneW}" height="${panelH - 56}" preserveAspectRatio="xMidYMin slice" clip-path="url(#phone)"/>
${square ? "" : `<g font-family="Assistant" font-size="${story ? 28 : 28}" font-weight="850" fill="#18392d">
  ${["טיוטת עסק בחינם", "מיקום, שעות ותמונות", "תשלום חד פעמי לפי משך ההופעה"].map((line, index) => {
    const y = panelY + 115 + index * (story ? 118 : 82);
    return `<circle cx="${factsX}" cy="${y - 10}" r="13" fill="${concept.accent}" stroke="#18392d" stroke-width="4"/><text x="${factsX - 28}" y="${y}" text-anchor="end">${esc(line)}</text>`;
  }).join("")}
</g>`}
<rect x="93" y="${ctaY + 9}" width="${story ? 226 : 188}" height="${story ? 82 : 70}" fill="#18392d"/>
<rect x="84" y="${ctaY}" width="${story ? 226 : 188}" height="${story ? 82 : 70}" fill="${concept.accent}" stroke="#18392d" stroke-width="5"/>
<text x="${84 + (story ? 113 : 94)}" y="${ctaY + (story ? 54 : 47)}" text-anchor="middle" font-family="Assistant" font-size="${story ? 38 : 32}" font-weight="900" fill="#fffaf0">${esc(concept.cta)}</text>
<text x="84" y="${story ? size.h - 105 : size.h - 58}" font-family="Assistant" font-size="${story ? 30 : 24}" font-weight="800" fill="#18392d">pokarov.co.il</text>
${draft ? `<g transform="translate(${size.w / 2} ${size.h / 2}) rotate(-28)" opacity=".22"><text x="0" y="-10" text-anchor="middle" font-family="Assistant" font-size="${story ? 86 : 72}" font-weight="900" fill="#18392d">DRAFT</text><text x="0" y="${story ? 78 : 62}" text-anchor="middle" font-family="Assistant" font-size="${story ? 52 : 42}" font-weight="900" fill="#18392d">NOT APPROVED</text></g>` : ""}
</svg>`;
}

await fs.mkdir(publishDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });

const assets = {
  logo: await dataUri(logo),
  [mapShot]: await dataUri(mapShot),
  [pricingShot]: await dataUri(pricingShot),
  assistant: await fontUri(fontAssistant),
  karantina: await fontUri(fontKarantina),
};

const manifest = [];
for (const concept of concepts) {
  for (const size of sizes) {
    for (const draft of [false, true]) {
      const dir = draft ? previewDir : publishDir;
      const suffix = draft ? "-draft-preview" : "-publish-candidate";
      const fileName = `${concept.id}-${size.key}-${size.w}x${size.h}${suffix}.png`;
      const svg = await svgFor(concept, size, draft, assets);
      await sharp(Buffer.from(svg)).png().toFile(path.join(dir, fileName));
      manifest.push({
        concept: concept.id,
        headline: concept.headline,
        format: size.key,
        width: size.w,
        height: size.h,
        draftPreview: draft,
        file: path.relative(outRoot, path.join(dir, fileName)),
        utmContent: concept.token,
        rightsSafeSources: "Owned Pokarov logo/font assets and truthful product UI screenshots only; no supplied people/business scene PNGs used.",
      });
    }
  }
}

await fs.writeFile(path.join(outRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
