/**
 * Generates PWA icons (any, maskable, monochrome, favicons, apple) and 3 install screenshots.
 * Run: npm run generate:pwa-icons
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
const INK = "#1A1118";
const MUTED = "#6B5460";
const LINE = "#EDE0E5";

function iconSvg(size: number, maskable = false): string {
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

/** White N on transparent — Android 13 monochrome / themed icon. */
function monochromeSvg(size: number): string {
  const fontSize = size * 0.5;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
    font-family="Georgia, 'Playfair Display', serif" font-weight="700"
    font-size="${fontSize}" fill="#FFFFFF">N</text>
</svg>`;
}

function exploreShot(): string {
  const w = 390;
  const h = 844;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${SURFACE}"/>
      <stop offset="100%" stop-color="#F8F2F5"/>
    </linearGradient>
    <linearGradient id="hero" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${PRIMARY}"/>
      <stop offset="100%" stop-color="${PRIMARY_DARK}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect x="0" y="0" width="${w}" height="320" fill="url(#hero)"/>
  <text x="28" y="72" font-family="Georgia, serif" font-size="28" fill="#fff" font-weight="700">Nexa Stays</text>
  <text x="28" y="130" font-family="system-ui, sans-serif" font-size="26" fill="#fff" font-weight="700">Find your next stay</text>
  <text x="28" y="162" font-family="system-ui, sans-serif" font-size="14" fill="rgba(255,255,255,0.85)">Beautiful search · Morocco destinations</text>
  <rect x="20" y="200" width="350" height="56" rx="16" fill="#fff"/>
  <text x="40" y="234" font-family="system-ui, sans-serif" font-size="14" fill="${MUTED}">Where to? Casablanca, Marrakech…</text>
  <rect x="20" y="360" width="165" height="120" rx="16" fill="#fff" stroke="${LINE}"/>
  <rect x="205" y="360" width="165" height="120" rx="16" fill="#fff" stroke="${LINE}"/>
  <text x="36" y="500" font-family="system-ui, sans-serif" font-size="13" fill="${INK}" font-weight="600">Casablanca</text>
  <text x="220" y="500" font-family="system-ui, sans-serif" font-size="13" fill="${INK}" font-weight="600">Marrakech</text>
  <rect x="20" y="530" width="165" height="120" rx="16" fill="#fff" stroke="${LINE}"/>
  <rect x="205" y="530" width="165" height="120" rx="16" fill="#fff" stroke="${LINE}"/>
  <text x="36" y="670" font-family="system-ui, sans-serif" font-size="13" fill="${INK}" font-weight="600">Taghazout</text>
  <text x="220" y="670" font-family="system-ui, sans-serif" font-size="13" fill="${INK}" font-weight="600">Fès</text>
</svg>`;
}

function listingShot(): string {
  const w = 390;
  const h = 844;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${SURFACE}"/>
  <rect x="0" y="0" width="${w}" height="280" fill="#D4A5B5"/>
  <rect x="12" y="12" width="180" height="120" rx="12" fill="#C48A9D"/>
  <rect x="200" y="12" width="178" height="120" rx="12" fill="#B87A90"/>
  <rect x="12" y="140" width="366" height="128" rx="12" fill="#E8B8C6"/>
  <text x="24" y="320" font-family="Georgia, serif" font-size="22" fill="${INK}" font-weight="700">Riad with courtyard</text>
  <text x="24" y="348" font-family="system-ui, sans-serif" font-size="13" fill="${MUTED}">Marrakech · Médina</text>
  <rect x="24" y="370" width="140" height="72" rx="12" fill="#fff" stroke="${LINE}"/>
  <text x="36" y="400" font-family="system-ui, sans-serif" font-size="11" fill="${MUTED}">Check-in</text>
  <text x="36" y="420" font-family="system-ui, sans-serif" font-size="13" fill="${INK}" font-weight="600">Apr 12</text>
  <rect x="176" y="370" width="140" height="72" rx="12" fill="#fff" stroke="${LINE}"/>
  <text x="188" y="400" font-family="system-ui, sans-serif" font-size="11" fill="${MUTED}">Check-out</text>
  <text x="188" y="420" font-family="system-ui, sans-serif" font-size="13" fill="${INK}" font-weight="600">Apr 15</text>
  <text x="24" y="480" font-family="system-ui, sans-serif" font-size="18" fill="${INK}" font-weight="700">1,250 MAD</text>
  <text x="24" y="504" font-family="system-ui, sans-serif" font-size="12" fill="${MUTED}">per night · transparent fees</text>
  <rect x="24" y="740" width="342" height="52" rx="16" fill="${PRIMARY}"/>
  <text x="195" y="772" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" fill="#fff" font-weight="700">Reserve</text>
</svg>`;
}

function hostShot(): string {
  const w = 390;
  const h = 844;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${SURFACE}"/>
  <text x="24" y="56" font-family="Georgia, serif" font-size="22" fill="${INK}" font-weight="700">Host dashboard</text>
  <text x="24" y="82" font-family="system-ui, sans-serif" font-size="13" fill="${MUTED}">Revenue · Bookings · Calendar sync</text>
  <rect x="20" y="110" width="350" height="100" rx="18" fill="#fff" stroke="${LINE}"/>
  <text x="36" y="148" font-family="system-ui, sans-serif" font-size="12" fill="${MUTED}">This month</text>
  <text x="36" y="180" font-family="system-ui, sans-serif" font-size="28" fill="${INK}" font-weight="700">18,400 MAD</text>
  <rect x="20" y="230" width="168" height="90" rx="16" fill="#fff" stroke="${LINE}"/>
  <text x="36" y="268" font-family="system-ui, sans-serif" font-size="12" fill="${MUTED}">Bookings</text>
  <text x="36" y="296" font-family="system-ui, sans-serif" font-size="22" fill="${PRIMARY}" font-weight="700">12</text>
  <rect x="202" y="230" width="168" height="90" rx="16" fill="#fff" stroke="${LINE}"/>
  <text x="218" y="268" font-family="system-ui, sans-serif" font-size="12" fill="${MUTED}">Live listings</text>
  <text x="218" y="296" font-family="system-ui, sans-serif" font-size="22" fill="${INK}" font-weight="700">3</text>
  <rect x="20" y="340" width="350" height="70" rx="16" fill="#fff" stroke="${LINE}"/>
  <text x="36" y="382" font-family="system-ui, sans-serif" font-size="14" fill="${INK}" font-weight="600">Calendar Sync</text>
  <text x="250" y="382" font-family="system-ui, sans-serif" font-size="12" fill="${PRIMARY}" font-weight="600">Connected</text>
  <rect x="20" y="430" width="350" height="120" rx="16" fill="#fff" stroke="${LINE}"/>
  <text x="36" y="468" font-family="system-ui, sans-serif" font-size="14" fill="${INK}" font-weight="600">Upcoming stays</text>
  <text x="36" y="500" font-family="system-ui, sans-serif" font-size="13" fill="${MUTED}">Guest check-in · Apr 14</text>
  <text x="36" y="524" font-family="system-ui, sans-serif" font-size="13" fill="${MUTED}">Guest check-in · Apr 18</text>
</svg>`;
}

async function writePng(svg: string, out: string) {
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log("wrote", out);
}

async function main() {
  fs.mkdirSync(ICONS, { recursive: true });
  fs.mkdirSync(SHOTS, { recursive: true });

  await writePng(iconSvg(16), path.join(ICONS, "favicon-16.png"));
  await writePng(iconSvg(32), path.join(ICONS, "favicon-32.png"));
  await writePng(iconSvg(180), path.join(ICONS, "apple-touch-icon.png"));
  await writePng(iconSvg(192), path.join(ICONS, "icon-192.png"));
  await writePng(iconSvg(512), path.join(ICONS, "icon-512.png"));
  await writePng(iconSvg(512, true), path.join(ICONS, "icon-maskable-512.png"));
  await writePng(monochromeSvg(512), path.join(ICONS, "icon-monochrome-512.png"));

  await writePng(exploreShot(), path.join(SHOTS, "explore.png"));
  await writePng(listingShot(), path.join(SHOTS, "listing.png"));
  await writePng(hostShot(), path.join(SHOTS, "host.png"));

  // Remove legacy stub names if regenerating clean set (keep if referenced elsewhere briefly)
  for (const legacy of ["narrow.png", "wide.png"]) {
    const p = path.join(SHOTS, legacy);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
