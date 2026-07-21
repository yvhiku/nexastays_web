/**
 * Reliable Next.js dev startup — prevents corrupted .next cache on Windows.
 *
 * 1. Stops any process listening on the dev port (avoids locked/stale servers)
 * 2. Removes .next + webpack cache (fixes missing vendor-chunks/*.js errors)
 * 3. Starts next dev
 *
 * Use `npm run dev:quick` to skip the clean step when the server was stopped normally.
 */
import { execSync, spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const port = String(process.env.PORT || process.env.NEXT_DEV_PORT || "3005");
const skipClean = process.argv.includes("--quick");

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function killPort(p) {
  if (process.platform === "win32") {
    try {
      const out = execSync(`netstat -ano | findstr :${p}`, { encoding: "utf8" });
      const pids = new Set();
      for (const line of out.split(/\r?\n/)) {
        if (!line.includes("LISTENING")) continue;
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
          log(`Stopped process ${pid} on port ${p}`);
        } catch {
          /* already gone */
        }
      }
    } catch {
      /* no listener */
    }
    return;
  }

  try {
    execSync(`lsof -ti:${p} | xargs -r kill -9`, { stdio: "ignore", shell: true });
  } catch {
    /* no listener */
  }
}

function cleanCaches() {
  const targets = [join(root, ".next"), join(root, "node_modules", ".cache")];
  for (const dir of targets) {
    if (!existsSync(dir)) continue;
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    log(`Removed ${dir.replace(root, ".").replace(/\\/g, "/")}`);
  }
}

async function main() {
  if (!skipClean) {
    log(`Preparing dev server on port ${port}…`);
    killPort(port);
    await sleep(800);
    cleanCaches();
  } else {
    killPort(port);
    await sleep(300);
  }

  log(`Starting Next.js dev server on http://localhost:${port}`);
  const child = spawn("npx", ["next", "dev", "-p", port], {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, NEXT_DEV_PORT: port },
  });

  child.on("exit", (code, signal) => {
    process.exit(code ?? (signal ? 1 : 0));
  });

  process.on("SIGINT", () => child.kill("SIGINT"));
  process.on("SIGTERM", () => child.kill("SIGTERM"));
}

void main();
