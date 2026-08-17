import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const kitDir = path.resolve(sourceDir, "..");
const logosDir = path.join(kitDir, "01-logos");
const fontsDir = path.join(kitDir, "03-fonts");

const [iconBuffer, fontBuffer] = await Promise.all([
  fs.readFile(path.join(logosDir, "pokarov-icon-official-512.png")),
  fs.readFile(path.join(fontsDir, "Karantina-Hebrew-700.woff2")),
]);

const iconData = iconBuffer.toString("base64");
const fontData = fontBuffer.toString("base64");

function lockupSvg(wordmarkColor) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="700" viewBox="0 0 2400 700" role="img" aria-labelledby="title desc">
  <title id="title">פה קרוב</title>
  <desc id="desc">לוגו פה קרוב: שם המותג לצד אייקון שני דוכנים בתוך סיכת מפה.</desc>
  <style>
    @font-face {
      font-family: "Karantina Embedded";
      src: url("data:font/woff2;base64,${fontData}") format("woff2");
      font-weight: 700;
      font-style: normal;
    }
  </style>
  <g>
    <text x="1660" y="470" text-anchor="start" direction="rtl" font-family="Karantina Embedded, Karantina, Arial, sans-serif" font-size="360" font-weight="700" fill="${wordmarkColor}">פה קרוב</text>
    <image href="data:image/png;base64,${iconData}" x="1740" y="30" width="640" height="640" preserveAspectRatio="xMidYMid meet" />
  </g>
</svg>`;
}

const variants = [
  {
    svg: "pokarov-logo-main.svg",
    png: "pokarov-logo-main-transparent-2400x700.png",
    color: "#17402D",
  },
  {
    svg: "pokarov-logo-for-light-background.svg",
    png: "pokarov-logo-for-light-background-2400x700.png",
    color: "#17402D",
  },
  {
    svg: "pokarov-logo-for-dark-background.svg",
    png: "pokarov-logo-for-dark-background-2400x700.png",
    color: "#FFFDF7",
  },
];

for (const variant of variants) {
  const svg = lockupSvg(variant.color);
  await fs.writeFile(path.join(logosDir, variant.svg), svg, "utf8");
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(logosDir, variant.png));
}

const iconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-labelledby="title desc">
  <title id="title">אייקון פה קרוב</title>
  <desc id="desc">אייקון שני דוכנים בתוך סיכת מפה, ללא טקסט.</desc>
  <image href="data:image/png;base64,${iconData}" width="512" height="512" preserveAspectRatio="xMidYMid meet" />
</svg>`;

await fs.writeFile(path.join(logosDir, "pokarov-icon-official.svg"), iconSvg, "utf8");
