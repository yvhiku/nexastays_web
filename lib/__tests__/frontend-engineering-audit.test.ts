import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { formatMessage } from "@/lib/i18n";
import { serializeJsonLd } from "@/lib/seo/safe-json-ld";

const read = (path: string) => readFileSync(path, "utf8");

test("rich translation formatting escapes raw HTML and interpolation values", () => {
  assert.equal(
    formatMessage("Welcome {em}{name}{/em}\n<script>alert(1)</script>", {
      name: "<img src=x onerror=alert(1)>",
    }),
    "Welcome <em>&lt;img src=x onerror=alert(1)&gt;</em><br />&lt;script&gt;alert(1)&lt;/script&gt;",
  );
});

test("JSON-LD serialization cannot terminate its inline script element", () => {
  const serialized = serializeJsonLd({
    title: "</script><script>alert('xss')</script>",
    separator: "\u2028",
  });
  assert.doesNotMatch(serialized, /<\/script/i);
  assert.match(serialized, /\\u003c\/script>/);
  assert.match(serialized, /\\u2028/);
  assert.deepEqual(JSON.parse(serialized), {
    title: "</script><script>alert('xss')</script>",
    separator: "\u2028",
  });
});

test("every JSON-LD script uses the shared safe serializer", () => {
  const files = [
    "app/layout.tsx",
    "app/[locale]/listings/[id]/page.tsx",
    "app/[locale]/stays/[segment]/page.tsx",
    "app/[locale]/stays/[segment]/[combo]/page.tsx",
    "app/[locale]/guides/[slug]/page.tsx",
  ];
  for (const file of files) {
    const source = read(file);
    assert.match(source, /serializeJsonLd/);
    assert.doesNotMatch(
      source,
      /dangerouslySetInnerHTML=\{\{ __html: JSON\.stringify/,
    );
  }
});

test("upload preview object URLs are released when their owners unmount", () => {
  const attachments = read("lib/messaging/AttachmentManager.ts");
  const listingWizard = read("app/[locale]/host/listings/new/page.tsx");
  assert.match(
    attachments,
    /return \(\) => \{[\s\S]*revokePreviews\(itemsRef\.current\)/,
  );
  assert.match(
    listingWizard,
    /return \(\) => \{[\s\S]*URL\.revokeObjectURL\(photo\.preview\)/,
  );
  assert.match(
    listingWizard,
    /URL\.revokeObjectURL\(walkthroughPreview\)/,
  );
});
