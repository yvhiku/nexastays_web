import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? sourceFiles(path) : [path];
  });
}

test("messaging uses desktop columns and tablet drawer breakpoints", () => {
  const shell = read("components/messaging/InboxLayoutShell.tsx");
  const thread = read("app/[locale]/inbox/[id]/page.tsx");

  assert.match(shell, /lg:w-\[280px\]/);
  assert.match(shell, /xl:w-\[300px\]/);
  assert.match(thread, /md:block lg:hidden/);
  assert.match(thread, /className="relative hidden min-h-0 shrink-0 bg-\[#fffafb\] lg:flex"/);
  assert.match(thread, /Math\.max\(320, Math\.min\(420,/);
  assert.match(thread, /min-width: 1024px/);
});

test("messaging surfaces do not introduce horizontal scrolling", () => {
  const roots = [
    join(process.cwd(), "components", "messaging"),
    join(process.cwd(), "app", "[locale]", "inbox"),
  ];
  const offenders = roots.flatMap(sourceFiles).filter((path) => {
    if (!/\.(tsx?|jsx?)$/.test(path)) return false;
    return /overflow-x-(auto|scroll)/.test(readFileSync(path, "utf8"));
  });

  assert.deepEqual(offenders, []);
});
