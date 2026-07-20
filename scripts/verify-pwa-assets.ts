/**
 * Verifies versioned PWA icons and hand-authored screenshots exist at 412×913.
 * Run: npm run verify:pwa-assets
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";
import {
  PWA_ICON_FILENAMES,
  PWA_ICON_VERSION,
  PWA_SCREENSHOT_FILENAMES,
  PWA_SCREENSHOT_SIZE,
} from "../lib/pwa-assets";

const ROOT = path.join(__dirname, "..");
const ICONS = path.join(ROOT, "public", "icons");
const SCREENSHOTS = path.join(ROOT, "public", "pwa", "screenshots");
const LOGO = path.join(ROOT, "public", "images", "nexastays.png");

async function main() {
  let failed = false;

  console.log(`Verifying PWA assets (version ${PWA_ICON_VERSION})…\n`);

  if (!fs.existsSync(LOGO)) {
    console.error("✗ missing public/images/nexastays.png");
    failed = true;
  } else {
    console.log("✓ images/nexastays.png");
  }

  for (const name of PWA_ICON_FILENAMES) {
    const p = path.join(ICONS, name);
    if (!fs.existsSync(p)) {
      console.error(`✗ missing icon: ${name}`);
      failed = true;
    } else {
      console.log(`✓ ${name}`);
    }
  }

  console.log("");

  for (const name of PWA_SCREENSHOT_FILENAMES) {
    const p = path.join(SCREENSHOTS, name);
    if (!fs.existsSync(p)) {
      console.error(`✗ missing screenshot: ${name}`);
      failed = true;
      continue;
    }
    try {
      const meta = await sharp(p).metadata();
      if (
        meta.width !== PWA_SCREENSHOT_SIZE.width ||
        meta.height !== PWA_SCREENSHOT_SIZE.height
      ) {
        console.error(
          `✗ screenshots/${name} is ${meta.width}x${meta.height}; expected ${PWA_SCREENSHOT_SIZE.width}x${PWA_SCREENSHOT_SIZE.height}`,
        );
        failed = true;
      } else {
        console.log(`✓ screenshots/${name} ${meta.width}x${meta.height}`);
      }
    } catch (e) {
      console.error(`✗ screenshots/${name} unreadable:`, e);
      failed = true;
    }
  }

  const favIco = path.join(ROOT, "public", "favicon.ico");
  if (!fs.existsSync(favIco)) {
    console.error("✗ missing public/favicon.ico");
    failed = true;
  } else {
    console.log("✓ favicon.ico");
  }

  const buildPath = path.join(ICONS, "build.json");
  if (fs.existsSync(buildPath)) {
    try {
      const build = JSON.parse(fs.readFileSync(buildPath, "utf8")) as {
        version?: string;
        sha256?: string;
      };
      if (build.version !== PWA_ICON_VERSION) {
        console.error(
          `✗ build.json version "${build.version}" !== PWA_ICON_VERSION "${PWA_ICON_VERSION}"`,
        );
        failed = true;
      } else {
        console.log(`\n✓ build.json version=${build.version} sha256=${build.sha256?.slice(0, 12)}…`);
      }
    } catch (e) {
      console.error("✗ build.json invalid:", e);
      failed = true;
    }
  }

  if (failed) {
    console.error("\nPWA asset verification failed.");
    process.exit(1);
  }
  console.log("\nAll PWA assets OK.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
