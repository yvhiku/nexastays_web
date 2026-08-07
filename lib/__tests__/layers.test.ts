import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { LAYERS } from "../ui/layers";

function sourceFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

test("global layers are strictly ordered", () => {
  const values = Object.values(LAYERS);
  assert.deepEqual(values, [...values].sort((a, b) => a - b));
  assert.equal(new Set(values).size, values.length);
});

test("Tailwind emits every dynamic semantic layer", () => {
  const config = readFileSync(join(process.cwd(), "tailwind.config.ts"), "utf8");
  assert.match(config, /safelist:\s*Object\.values\(LAYER_CLASS\)/);
  assert.match(config, /\.\/lib\/\*\*\/\*\.\{js,ts,jsx,tsx,mdx\}/);
});

test("selected map listing renders above Leaflet panes", () => {
  const exploreMap = readFileSync(
    join(process.cwd(), "components", "explore", "ExploreMap.tsx"),
    "utf8",
  );

  assert.match(
    exploreMap,
    /Preview[\s\S]*absolute bottom-4 left-4 right-4 z-layer-popover/,
  );
});

test("every Leaflet map is contained below application overlays", () => {
  const globals = readFileSync(
    join(process.cwd(), "app", "globals.css"),
    "utf8",
  );
  const hostMap = readFileSync(
    join(
      process.cwd(),
      "components",
      "host",
      "listing-wizard",
      "HostLocationMapPicker.tsx",
    ),
    "utf8",
  );
  const detailMap = readFileSync(
    join(process.cwd(), "components", "listing", "ListingDetailMap.tsx"),
    "utf8",
  );

  assert.match(
    globals,
    /\.leaflet-container\s*\{[\s\S]*isolation:\s*isolate;[\s\S]*z-index:\s*0;/,
  );
  assert.match(hostMap, /relative z-layer-base isolate/);
  assert.match(detailMap, /relative z-layer-base isolate/);
});

test("application source has no numeric z-index utilities or literals", () => {
  const roots = ["app", "components", "contexts", "lib"];
  const violations = roots.flatMap((root) =>
    sourceFiles(join(process.cwd(), root)).flatMap((file) => {
      if (file.endsWith(join("lib", "__tests__", "layers.test.ts"))) return [];
      const source = readFileSync(file, "utf8");
      return /\bz-(?:\d+|\[[^\]]+\])\b|zIndex\s*:\s*\d+/g.test(source)
        ? [file]
        : [];
    }),
  );

  assert.deepEqual(
    violations,
    [],
    `Use semantic layers from lib/ui/layers.ts:\n${violations.join("\n")}`,
  );
});
