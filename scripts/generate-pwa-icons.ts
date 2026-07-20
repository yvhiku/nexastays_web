/**
 * Generates versioned PWA icons from public/images/nexastays.png.
 * Run: npm run generate:pwa-icons
 *
 * Browser favicons + any icons: transparent logo mark (black knocked out).
 * Maskable only: black plate + SAFE_PADDING.
 * Never writes under public/pwa/screenshots.
 * Bump ICON_VERSION in sync with lib/pwa-assets.ts PWA_ICON_VERSION.
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = path.join(__dirname, "..");
const SOURCE = path.join(ROOT, "public", "images", "nexastays.png");
const ICONS = path.join(ROOT, "public", "icons");
const PUBLIC = path.join(ROOT, "public");
const SCREENSHOTS = path.join(ROOT, "public", "pwa", "screenshots");

/** Keep in sync with lib/pwa-assets.ts → PWA_ICON_VERSION */
const ICON_VERSION = "v3";
const SAFE_PADDING = 0.18;
const FAVICON_PADDING = 0.08;
/** Luminance at/below this becomes transparent (knock out black plate). */
const BLACK_LUMA_THRESHOLD = 28;

const SHORTCUT_BG: Record<string, string> = {
  explore: "#000000",
  saved: "#1A1A1A",
  trips: "#12161C",
  host: "#0A0610",
};

const REQUIRED_FILES = [
  `favicon-16.${ICON_VERSION}.png`,
  `favicon-32.${ICON_VERSION}.png`,
  `favicon-48.${ICON_VERSION}.png`,
  `apple-touch-180.${ICON_VERSION}.png`,
  `icon-192.${ICON_VERSION}.png`,
  `icon-512.${ICON_VERSION}.png`,
  `maskable-512.${ICON_VERSION}.png`,
  `monochrome-512.${ICON_VERSION}.png`,
  `shortcut-explore.${ICON_VERSION}.png`,
  `shortcut-saved.${ICON_VERSION}.png`,
  `shortcut-trips.${ICON_VERSION}.png`,
  `shortcut-host.${ICON_VERSION}.png`,
  "build.json",
] as const;

function assertNotScreenshotPath(out: string) {
  const resolved = path.resolve(out);
  const shotRoot = path.resolve(SCREENSHOTS);
  if (resolved === shotRoot || resolved.startsWith(shotRoot + path.sep)) {
    throw new Error(`Refusing to write under screenshots: ${out}`);
  }
}

function sha256File(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

async function writeSafe(out: string, buf: Buffer) {
  assertNotScreenshotPath(out);
  await fs.promises.writeFile(out, buf);
  console.log("wrote", path.relative(ROOT, out));
}

/** Knock near-black background to transparent; keep pink mark. */
async function knockoutBlackToAlpha(sourceBuf: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(sourceBuf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += 4) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (luma <= BLACK_LUMA_THRESHOLD) {
      out[i + 3] = 0;
    }
  }

  return sharp(out, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

/** Transparent logo mark on clear canvas. */
async function renderTransparent(
  markBuf: Buffer,
  size: number,
  padding = FAVICON_PADDING,
): Promise<Buffer> {
  const inner = Math.max(1, Math.round(size * (1 - 2 * padding)));
  const logo = await sharp(markBuf)
    .resize(inner, inner, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toBuffer();
}

/** Logo on solid background (maskable / tinted shortcuts). */
async function renderOnBackground(
  markBuf: Buffer,
  size: number,
  background: string,
  padding = SAFE_PADDING,
): Promise<Buffer> {
  const inner = Math.max(1, Math.round(size * (1 - 2 * padding)));
  const logo = await sharp(markBuf)
    .resize(inner, inner, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toBuffer();
}

async function renderMonochrome(markBuf: Buffer, size: number): Promise<Buffer> {
  const inner = Math.max(1, Math.round(size * (1 - 2 * SAFE_PADDING)));
  const logo = await sharp(markBuf)
    .resize(inner, inner, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = logo;
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    const mark = a > 10 ? 255 : 0;
    out[i] = mark;
    out[i + 1] = mark;
    out[i + 2] = mark;
    out[i + 3] = mark ? a : 0;
  }

  const markPng = await sharp(out, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: markPng, gravity: "centre" }])
    .png()
    .toBuffer();
}

/** Minimal multi-size ICO (PNG-encoded images) for /favicon.ico */
function buildIco(pngBuffers: Buffer[]): Buffer {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const dirEntries: Buffer[] = [];
  let offset = 6 + count * 16;
  const bodies: Buffer[] = [];

  for (const png of pngBuffers) {
    const meta = Buffer.alloc(16);
    // 0 = 256 in ICO size fields; we only pass <=48 so fine
    const sizeProbe = sharp(png);
    // Use 0 for width/height when unknown; browsers read PNG IHDR inside
    meta.writeUInt8(0, 0);
    meta.writeUInt8(0, 1);
    meta.writeUInt8(0, 2);
    meta.writeUInt8(0, 3);
    meta.writeUInt16LE(1, 4);
    meta.writeUInt16LE(32, 6);
    meta.writeUInt32LE(png.length, 8);
    meta.writeUInt32LE(offset, 12);
    dirEntries.push(meta);
    bodies.push(png);
    offset += png.length;
    void sizeProbe;
  }

  return Buffer.concat([header, ...dirEntries, ...bodies]);
}

function validateOutputs() {
  for (const name of REQUIRED_FILES) {
    const p = path.join(ICONS, name);
    if (!fs.existsSync(p)) {
      throw new Error(`Missing required PWA asset: ${name}`);
    }
    console.log(`✓ ${name}`);
  }
  const fav = path.join(PUBLIC, "favicon.ico");
  if (!fs.existsSync(fav)) {
    throw new Error("Missing public/favicon.ico");
  }
  console.log("✓ ../favicon.ico");
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    throw new Error(`Source logo missing: ${SOURCE}`);
  }

  const sha256 = sha256File(SOURCE);
  const sourceBuf = fs.readFileSync(SOURCE);
  const markBuf = await knockoutBlackToAlpha(sourceBuf);

  if (fs.existsSync(ICONS)) {
    fs.rmSync(ICONS, { recursive: true, force: true });
  }
  fs.mkdirSync(ICONS, { recursive: true });

  const fav16 = await renderTransparent(markBuf, 16);
  const fav32 = await renderTransparent(markBuf, 32);
  const fav48 = await renderTransparent(markBuf, 48);

  await writeSafe(path.join(ICONS, `favicon-16.${ICON_VERSION}.png`), fav16);
  await writeSafe(path.join(ICONS, `favicon-32.${ICON_VERSION}.png`), fav32);
  await writeSafe(path.join(ICONS, `favicon-48.${ICON_VERSION}.png`), fav48);
  await writeSafe(
    path.join(ICONS, `apple-touch-180.${ICON_VERSION}.png`),
    await renderTransparent(markBuf, 180),
  );
  await writeSafe(
    path.join(ICONS, `icon-192.${ICON_VERSION}.png`),
    await renderTransparent(markBuf, 192),
  );
  await writeSafe(
    path.join(ICONS, `icon-512.${ICON_VERSION}.png`),
    await renderTransparent(markBuf, 512),
  );
  await writeSafe(
    path.join(ICONS, `maskable-512.${ICON_VERSION}.png`),
    await renderOnBackground(markBuf, 512, "#000000"),
  );
  await writeSafe(
    path.join(ICONS, `monochrome-512.${ICON_VERSION}.png`),
    await renderMonochrome(markBuf, 512),
  );

  for (const [key, bg] of Object.entries(SHORTCUT_BG)) {
    await writeSafe(
      path.join(ICONS, `shortcut-${key}.${ICON_VERSION}.png`),
      await renderOnBackground(markBuf, 96, bg, 0.12),
    );
  }

  // Root favicon for browsers that request /favicon.ico
  const ico = buildIco([fav16, fav32, fav48]);
  await writeSafe(path.join(PUBLIC, "favicon.ico"), ico);

  const files = REQUIRED_FILES.filter((f) => f !== "build.json");
  const build = {
    source: "public/images/nexastays.png",
    sha256,
    version: ICON_VERSION,
    generatedAt: new Date().toISOString(),
    safePadding: SAFE_PADDING,
    transparentFavicons: true,
    files: [...files, "favicon.ico"],
  };
  await writeSafe(path.join(ICONS, "build.json"), Buffer.from(JSON.stringify(build, null, 2)));

  console.log("");
  validateOutputs();
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
