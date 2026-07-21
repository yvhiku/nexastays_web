/**
 * Reliable Next.js dev startup — v1.1
 *
 * - Isolated build dir: .next-dev (dev) vs .next (production build)
 * - Pre-flight guards: duplicate dev server, build+dev collision, .build-version
 * - Auto-recovery on webpack chunk desync (strict signature only)
 *
 * Flags:
 *   --quick   Skip version/clean prep; still blocks duplicate server
 *   --force   Kill port + clean .next-dev (dev:recover)
 *   --turbo   Pass --turbo to next dev
 */
import { execSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const port = String(process.env.PORT || process.env.NEXT_DEV_PORT || "3005");
const devDistDir = join(root, ".next-dev");
const buildVersionPath = join(devDistDir, ".build-version");
const skipClean = process.argv.includes("--quick");
const forceStart = process.argv.includes("--force");
const useTurbo = process.argv.includes("--turbo");

let recovering = false;
let restartAllowed = true;

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

function warn(msg) {
  process.stderr.write(`${msg}\n`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readJsonSafe(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function getGitCommit() {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

function getNextVersion() {
  const pkg = readJsonSafe(join(root, "package.json"));
  const raw = pkg?.dependencies?.next ?? pkg?.devDependencies?.next ?? "unknown";
  return String(raw).replace(/^[\^~]/, "");
}

function getCurrentBuildVersion() {
  return {
    gitCommit: getGitCommit(),
    nextVersion: getNextVersion(),
    timestamp: new Date().toISOString(),
  };
}

function buildVersionMatches(stored, current) {
  if (!stored) return false;
  return stored.gitCommit === current.gitCommit && stored.nextVersion === current.nextVersion;
}

function writeBuildVersion(current) {
  mkdirSync(devDistDir, { recursive: true });
  writeFileSync(buildVersionPath, `${JSON.stringify(current, null, 2)}\n`, "utf8");
}

function portListenerPids(p) {
  const pids = new Set();
  if (process.platform === "win32") {
    try {
      const out = execSync(`netstat -ano | findstr :${p}`, { encoding: "utf8" });
      for (const line of out.split(/\r?\n/)) {
        if (!line.includes("LISTENING")) continue;
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid);
      }
    } catch {
      /* no listener */
    }
    return pids;
  }
  try {
    const out = execSync(`lsof -ti:${p}`, { encoding: "utf8", shell: true });
    for (const pid of out.split(/\r?\n/)) {
      if (pid.trim()) pids.add(pid.trim());
    }
  } catch {
    /* no listener */
  }
  return pids;
}

function isPortListening(p) {
  return portListenerPids(p).size > 0;
}

function killPort(p) {
  for (const pid of portListenerPids(p)) {
    try {
      if (process.platform === "win32") {
        execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
      } else {
        execSync(`kill -9 ${pid}`, { stdio: "ignore" });
      }
      log(`Stopped process ${pid} on port ${p}`);
    } catch {
      /* already gone */
    }
  }
}

function isNextBuildRunning() {
  try {
    if (process.platform === "win32") {
      const out = execSync('wmic process where "name=\'node.exe\'" get ProcessId,CommandLine /format:list', {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      return /next\s+build/i.test(out);
    }
    const out = execSync("ps aux", { encoding: "utf8" });
    return /next\s+build/i.test(out);
  } catch {
    return false;
  }
}

function guardDuplicateDevServer() {
  if (forceStart || recovering) return;
  if (!isPortListening(port)) return;
  warn("");
  warn("Another Next.js dev server is already running.");
  warn(`Port ${port} is in use. Stop it first or use a different port.`);
  warn("To force restart: npm run dev:recover");
  warn("");
  process.exit(1);
}

function guardBuildCollision() {
  if (!isNextBuildRunning()) return;
  warn("");
  warn("Warning: next build appears to be running. Stop build before starting dev");
  warn("to avoid artifact conflicts (even with separate distDir).");
  warn("");
}

function cleanDevCaches() {
  const targets = [devDistDir, join(root, "node_modules", ".cache")];
  for (const dir of targets) {
    if (!existsSync(dir)) continue;
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    log(`Removed ${dir.replace(root, ".").replace(/\\/g, "/")}`);
  }
}

function ensureDevCacheFresh() {
  if (skipClean && !forceStart) return;

  const current = getCurrentBuildVersion();
  const stored = readJsonSafe(buildVersionPath);

  if (forceStart) {
    cleanDevCaches();
  } else if (!buildVersionMatches(stored, current)) {
    log("Build version changed — cleaning .next-dev");
    cleanDevCaches();
  }

  writeBuildVersion(current);
}

function isChunkDesyncError(text) {
  if (!text.includes("MODULE_NOT_FOUND")) return false;

  const patternA =
    text.includes("webpack-runtime") &&
    /Cannot find module '\.\/\d+\.js'/.test(text);

  const patternB =
    text.includes(".next-dev/server/webpack-runtime.js") ||
    text.includes(".next-dev\\server\\webpack-runtime.js");

  return patternA || patternB;
}

async function waitForHealthy(child, timeoutMs = 120_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (child.exitCode != null) return false;
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(2000) });
      if (res.ok || res.status === 307 || res.status === 308) return true;
    } catch {
      /* not ready */
    }
    await sleep(500);
  }
  return false;
}

function spawnDevServer() {
  const args = ["next", "dev", "-p", port];
  if (useTurbo) args.push("--turbo");

  log(`Starting Next.js dev server on http://localhost:${port}${useTurbo ? " (Turbopack)" : ""}`);

  const child = spawn("npx", args, {
    cwd: root,
    stdio: ["inherit", "pipe", "pipe"],
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: "development",
      NEXT_DEV_PORT: port,
    },
  });

  let errorBuffer = "";

  const handleOutput = (chunk) => {
    const text = chunk.toString();
    process.stdout.write(text);
    if (text.includes("Ready in") || text.includes("✓ Ready")) {
      writeBuildVersion(getCurrentBuildVersion());
    }
    errorBuffer = (errorBuffer + text).slice(-8000);
    if (!restartAllowed || recovering) return;
    if (!isChunkDesyncError(errorBuffer)) return;

    recovering = true;
    restartAllowed = false;
    warn("");
    warn("Chunk desync detected — cleaning .next-dev and restarting…");
    warn("");

    child.kill("SIGTERM");
  };

  child.stdout?.on("data", handleOutput);
  child.stderr?.on("data", (chunk) => {
    const text = chunk.toString();
    process.stderr.write(text);
    errorBuffer = (errorBuffer + text).slice(-8000);
    if (!restartAllowed || recovering) return;
    if (!isChunkDesyncError(errorBuffer)) return;

    recovering = true;
    restartAllowed = false;
    warn("");
    warn("Chunk desync detected — cleaning .next-dev and restarting…");
    warn("");

    child.kill("SIGTERM");
  });

  child.on("exit", async (code, signal) => {
    if (recovering) {
      killPort(port);
      await sleep(800);
      cleanDevCaches();
      writeBuildVersion(getCurrentBuildVersion());
      recovering = false;
      const nextChild = spawnDevServer();
      const healthy = await waitForHealthy(nextChild);
      restartAllowed = true;
      if (!healthy) {
        warn("Dev server did not become healthy after recovery restart.");
      }
      return;
    }
    process.exit(code ?? (signal ? 1 : 0));
  });

  return child;
}

async function main() {
  guardDuplicateDevServer();
  guardBuildCollision();

  if (!skipClean || forceStart) {
    log(`Preparing dev server on port ${port}…`);
    if (forceStart) {
      killPort(port);
      await sleep(800);
    }
    ensureDevCacheFresh();
  }

  spawnDevServer();

  process.on("SIGINT", () => process.exit(0));
  process.on("SIGTERM", () => process.exit(0));
}

void main();
