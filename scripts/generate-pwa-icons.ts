/**
 * Generates versioned PWA icons from public/images/nexastays.png.
 * Run: npm run generate:pwa-icons
 *
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
const SCREENSHOTS = path.join(ROOT, "public", "pwa", "screenshots");

/** Keep in sync with lib/pwa-assets.ts → PWA_ICON_VERSION */
const ICON_VERSION = "v2";
const SAFE_PADDING = 0.18;

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

/** Square icon: logo contained with SAFE_PADDING on solid background. */
async function renderIcon(
  sourceBuf: Buffer,
  size: number,
  background: string,
): Promise<Buffer> {
  const inner = Math.round(size * (1 - 2 * SAFE_PADDING));
  const logo = await sharp(sourceBuf)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
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

/** White silhouette for Android monochrome / themed icons. */
async function renderMonochrome(sourceBuf: Buffer, size: number): Promise<Buffer> {
  const inner = Math.round(size * (1 - 2 * SAFE_PADDING));
  const logo = await sharp(sourceBuf)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = logo;
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
    // Keep non-black mark pixels as white with original alpha strength
    const mark = lum > 20 ? 255 : 0;
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

function validateOutputs() {
  for (const name of REQUIRED_FILES) {
    const p = path.join(ICONS, name);
    if (!fs.existsSync(p)) {
      throw new Error(`Missing required PWA asset: ${name}`);
    }
    console.log(`✓ ${name}`);
  }
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    throw new Error(`Source logo missing: ${SOURCE}`);
  }

  const sha256 = sha256File(SOURCE);
  const sourceBuf = fs.readFileSync(SOURCE);

  // Idempotent: wipe and recreate icons dir (never touches screenshots)
  if (fs.existsSync(ICONS)) {
    fs.rmSync(ICONS, { recursive: true, force: true });
  }
  fs.mkdirSync(ICONS, { recursive: true });

  const black = "#000000";

  await writeSafe(
    path.join(ICONS, `favicon-16.${ICON_VERSION}.png`),
    await renderIcon(sourceBuf, 16, black),
  );
  await writeSafe(
    path.join(ICONS, `favicon-32.${ICON_VERSION}.png`),
    await renderIcon(sourceBuf, 32, black),
  );
  await writeSafe(
    path.join(ICONS, `favicon-48.${ICON_VERSION}.png`),
    await renderIcon(sourceBuf, 48, black),
  );
  await writeSafe(
    path.join(ICONS, `apple-touch-180.${ICON_VERSION}.png`),
    await renderIcon(sourceBuf, 180, black),
  );
  await writeSafe(
    path.join(ICONS, `icon-192.${ICON_VERSION}.png`),
    await renderIcon(sourceBuf, 192, black),
  );
  await writeSafe(
    path.join(ICONS, `icon-512.${ICON_VERSION}.png`),
    await renderIcon(sourceBuf, 512, black),
  );
  await writeSafe(
    path.join(ICONS, `maskable-512.${ICON_VERSION}.png`),
    await renderIcon(sourceBuf, 512, black),
  );
  await writeSafe(
    path.join(ICONS, `monochrome-512.${ICON_VERSION}.png`),
    await renderMonochrome(sourceBuf, 512),
  );

  for (const [key, bg] of Object.entries(SHORTCUT_BG)) {
    await writeSafe(
      path.join(ICONS, `shortcut-${key}.${ICON_VERSION}.png`),
      await renderIcon(sourceBuf, 96, bg),
    );
  }

  const files = REQUIRED_FILES.filter((f) => f !== "build.json");
  const build = {
    source: "public/images/nexastays.png",
    sha256,
    version: ICON_VERSION,
    generatedAt: new Date().toISOString(),
    safePadding: SAFE_PADDING,
    files: [...files],
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
