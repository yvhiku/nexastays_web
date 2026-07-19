/**
 * Generates dedicated PWA app icons (white N on gradient) and install screenshots.
 * Run: npx tsx scripts/generate-pwa-icons.ts
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = path.join(__dirname, "..");
const ICONS = path.join(ROOT, "public", "icons");
const SHOTS = path.join(ROOT, "public", "pwa", "screenshots");

const PRIMARY = "#E8507A";
const PRIMARY_DARK = "#C93A62";
const SURFACE = "#FDFBFC";

function iconSvg(size: number, maskable = false): string {
  const pad = maskable ? size * 0.18 : size * 0.12;
  const r = maskable ? size * 0.22 : size * 0.18;
  const fontSize = size * 0.42;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${PRIMARY}"/>
      <stop offset="100%" stop-color="${PRIMARY_DARK}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#g)"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
    font-family="Georgia, 'Playfair Display', serif" font-weight="700"
    font-size="${fontSize}" fill="#FFFFFF">N</text>
</svg>`;
}

function shotSvg(w: number, h: number, label: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${SURFACE}"/>
      <stop offset="100%" stop-color="#F8F2F5"/>
    </linearGradient>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${PRIMARY}"/>
      <stop offset="100%" stop-color="${PRIMARY_DARK}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect x="${w * 0.08}" y="${h * 0.12}" width="${w * 0.84}" height="${h * 0.62}" rx="24" fill="#fff" stroke="#EDE0E5"/>
  <circle cx="${w * 0.22}" cy="${h * 0.28}" r="${Math.min(w, h) * 0.06}" fill="url(#g)"/>
  <text x="${w * 0.22}" y="${h * 0.29}" text-anchor="middle" dominant-baseline="middle"
    font-family="Georgia, serif" font-size="${Math.min(w, h) * 0.05}" fill="#fff" font-weight="700">N</text>
  <text x="${w * 0.5}" y="${h * 0.48}" text-anchor="middle"
    font-family="system-ui, sans-serif" font-size="${Math.min(w, h) * 0.045}" fill="#1A1118" font-weight="600">${label}</text>
  <text x="${w * 0.5}" y="${h * 0.56}" text-anchor="middle"
    font-family="system-ui, sans-serif" font-size="${Math.min(w, h) * 0.028}" fill="#6B5460">Verified stays in Morocco</text>
  <rect x="${w * 0.3}" y="${h * 0.82}" width="${w * 0.4}" height="${h * 0.06}" rx="16" fill="${PRIMARY}"/>
</svg>`;
}

async function writePng(svg: string, out: string) {
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log("wrote", out);
}

async function main() {
  fs.mkdirSync(ICONS, { recursive: true });
  fs.mkdirSync(SHOTS, { recursive: true });

  await writePng(iconSvg(192), path.join(ICONS, "icon-192.png"));
  await writePng(iconSvg(512), path.join(ICONS, "icon-512.png"));
  await writePng(iconSvg(512, true), path.join(ICONS, "icon-maskable-512.png"));
  await writePng(iconSvg(180), path.join(ICONS, "apple-touch-icon.png"));

  await writePng(
    shotSvg(390, 844, "Explore Morocco"),
    path.join(SHOTS, "narrow.png"),
  );
  await writePng(
    shotSvg(1280, 720, "Nexa Stays"),
    path.join(SHOTS, "wide.png"),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
