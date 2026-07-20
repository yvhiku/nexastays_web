/**
 * Verifies brand logo, favicon, and hand-authored screenshots exist.
 * Run: npm run verify:pwa-assets
 */
import fs from "fs";
import path from "path";
import { PWA_SCREENSHOT_FILENAMES } from "../lib/pwa-assets";

const ROOT = path.join(__dirname, "..");
const LOGO = path.join(ROOT, "public", "images", "nexastays.png");
const FAVICON = path.join(ROOT, "public", "favicon.ico");
const SCREENSHOTS = path.join(ROOT, "public", "pwa", "screenshots");
const ICONS_DIR = path.join(ROOT, "public", "icons");

function main() {
  let failed = false;

  console.log("Verifying PWA brand assets…\n");

  if (!fs.existsSync(LOGO)) {
    console.error("✗ missing public/images/nexastays.png");
    failed = true;
  } else {
    console.log("✓ images/nexastays.png");
  }

  if (!fs.existsSync(FAVICON)) {
    console.error("✗ missing public/favicon.ico");
    failed = true;
  } else {
    console.log("✓ favicon.ico");
  }

  for (const name of PWA_SCREENSHOT_FILENAMES) {
    const p = path.join(SCREENSHOTS, name);
    if (!fs.existsSync(p)) {
      console.error(`✗ missing screenshot: ${name}`);
      failed = true;
    } else {
      console.log(`✓ screenshots/${name}`);
    }
  }

  if (fs.existsSync(ICONS_DIR)) {
    const leftover = fs.readdirSync(ICONS_DIR);
    if (leftover.length) {
      console.error(`✗ public/icons should be empty or removed; found: ${leftover.join(", ")}`);
      failed = true;
    } else {
      console.log("✓ public/icons empty");
    }
  } else {
    console.log("✓ public/icons absent");
  }

  if (failed) {
    console.error("\nPWA asset verification failed.");
    process.exit(1);
  }
  console.log("\nAll PWA assets OK.");
}

main();
