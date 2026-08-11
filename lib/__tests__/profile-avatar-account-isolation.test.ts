import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("ProfileAvatar clears and refetches when account identity changes", () => {
  const avatar = read("components/ProfileAvatar.tsx");
  assert.match(avatar, /userId\?:/);
  assert.match(avatar, /cache:\s*["']no-store["']/);
  assert.match(avatar, /AbortController/);
  assert.match(avatar, /\[hasPhoto,\s*token,\s*userId\]/);
  assert.match(avatar, /URL\.revokeObjectURL/);
  assert.match(
    avatar,
    /if\s*\(!hasPhoto\s*\|\|\s*!token\)[\s\S]*return \(\) =>/,
  );
});

test("navbar and profile pass userId into ProfileAvatar", () => {
  const nav = read("components/navbar/NavBar.tsx");
  const profile = read("app/[locale]/profile/page.tsx");
  assert.match(nav, /userId=\{user\?\.id/);
  assert.match(profile, /userId=\{user\?\.id/);
});
