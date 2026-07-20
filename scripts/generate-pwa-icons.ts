/**
 * Generates public/favicon.ico from public/images/nexastays.png (transparent mark).
 * Does not write under public/icons or public/pwa/screenshots.
 * Run: npm run generate:pwa-icons
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = path.join(__dirname, "..");
const SOURCE = path.join(ROOT, "public", "images", "nexastays.png");
const PUBLIC = path.join(ROOT, "public");
const FAVICON_OUT = path.join(PUBLIC, "favicon.ico");
const SCREENSHOTS = path.join(ROOT, "public", "pwa", "screenshots");
const ICONS_DIR = path.join(ROOT, "public", "icons");

const BLACK_LUMA_THRESHOLD = 28;
const FAVICON_PADDING = 0.08;

function assertNotScreenshotPath(out: string) {
  const resolved = path.resolve(out);
  const shotRoot = path.resolve(SCREENSHOTS);
  if (resolved === shotRoot || resolved.startsWith(shotRoot + path.sep)) {
    throw new Error(`Refusing to write under screenshots: ${out}`);
  }
}

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
    if (luma <= BLACK_LUMA_THRESHOLD) out[i + 3] = 0;
  }

  return sharp(out, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

async function renderTransparent(markBuf: Buffer, size: number): Promise<Buffer> {
  const inner = Math.max(1, Math.round(size * (1 - 2 * FAVICON_PADDING)));
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
  }

  return Buffer.concat([header, ...dirEntries, ...bodies]);
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    throw new Error(`Source logo missing: ${SOURCE}`);
  }

  const sourceBuf = fs.readFileSync(SOURCE);
  const sha256 = crypto.createHash("sha256").update(sourceBuf).digest("hex");
  const markBuf = await knockoutBlackToAlpha(sourceBuf);

  const fav16 = await renderTransparent(markBuf, 16);
  const fav32 = await renderTransparent(markBuf, 32);
  const fav48 = await renderTransparent(markBuf, 48);

  assertNotScreenshotPath(FAVICON_OUT);
  await fs.promises.writeFile(FAVICON_OUT, buildIco([fav16, fav32, fav48]));
  console.log("wrote public/favicon.ico");

  // Ensure legacy generated icon folder stays empty
  if (fs.existsSync(ICONS_DIR)) {
    fs.rmSync(ICONS_DIR, { recursive: true, force: true });
    console.log("removed public/icons (unused)");
  }

  console.log(`source sha256=${sha256.slice(0, 12)}…`);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
