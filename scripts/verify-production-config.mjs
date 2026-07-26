import fs from "node:fs";
import path from "node:path";

function parseEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const values = {};
  for (const rawLine of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
  return values;
}

const root = process.cwd();
const fileEnv = [
  ".env",
  ".env.local",
  ".env.production",
  ".env.production.local",
].reduce((values, file) => ({ ...values, ...parseEnvFile(path.join(root, file)) }), {});
const env = { ...fileEnv, ...process.env };
const failures = [];

function requireHttps(name, { allowSameOrigin = false } = {}) {
  const value = env[name]?.trim();
  if (!value) {
    failures.push(`${name} is required`);
    return;
  }
  if (allowSameOrigin && value.startsWith("/")) return;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") failures.push(`${name} must use HTTPS`);
    if (["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
      failures.push(`${name} must not target a loopback host`);
    }
    if (url.username || url.password) failures.push(`${name} must not contain URL credentials`);
  } catch {
    failures.push(`${name} must be a valid URL`);
  }
}

requireHttps("NEXT_PUBLIC_IDENTITY_API_BASE_URL");
requireHttps("NEXT_PUBLIC_STAYS_API_BASE_URL");
requireHttps("NEXT_PUBLIC_SITE_URL");
requireHttps("NEXT_PUBLIC_ANALYTICS_ENDPOINT", { allowSameOrigin: true });
requireHttps("NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT", { allowSameOrigin: true });

if ((env.NEXT_PUBLIC_STAYS_PAYMENT_PROVIDER ?? "mock").toLowerCase() === "mock") {
  failures.push("NEXT_PUBLIC_STAYS_PAYMENT_PROVIDER must not be mock");
}
if (env.NEXT_PUBLIC_DISABLE_PWA === "true") {
  failures.push("NEXT_PUBLIC_DISABLE_PWA must not disable the production service worker");
}
if (env.NEXT_PUBLIC_API_BASE_URL) {
  failures.push("NEXT_PUBLIC_API_BASE_URL is legacy and must be removed from production");
}

if (failures.length > 0) {
  console.error("Production configuration is not release-ready:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Production configuration contract passed.");
