import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import { assertNotServiceRoleKey } from "../lib/supabase-keys.ts";

const jwt = (payload: object) =>
  [
    Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url"),
    Buffer.from(JSON.stringify(payload)).toString("base64url"),
    "signature",
  ].join(".");

describe("Supabase key guard", () => {
  test("accepts anon and publishable keys", () => {
    assert.doesNotThrow(() => assertNotServiceRoleKey(jwt({ role: "anon" })));
    assert.doesNotThrow(() => assertNotServiceRoleKey("sb_publishable_abc123"));
  });

  test("rejects service-role and secret keys", () => {
    assert.throws(() => assertNotServiceRoleKey(jwt({ role: "service_role" })), /service-role/);
    assert.throws(() => assertNotServiceRoleKey("sb_secret_abc123"), /secret key/);
  });
});

describe("browser code", () => {
  const root = new URL("..", import.meta.url).pathname;
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      if (["node_modules", ".next", ".git", "tests", "scripts"].includes(name)) continue;
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.(ts|tsx)$/.test(name)) files.push(path);
    }
  };
  walk(root);
  const clientFiles = files.filter((file) =>
    /^\s*["']use client["']/.test(readFileSync(file, "utf8"))
  );

  test("client components exist (sanity check)", () => {
    assert.ok(clientFiles.length >= 3);
  });

  for (const file of clientFiles) {
    test(`${file.slice(root.length)} reads no secrets or server modules`, () => {
      const source = readFileSync(file, "utf8");
      assert.doesNotMatch(source, /process\.env/);
      assert.doesNotMatch(source, /SERVICE_ROLE|DATABASE_URL|sb_secret_/);
      assert.doesNotMatch(source, /from ["']@\/lib\/server\//);
      assert.doesNotMatch(source, /from ["']postgres["']/);
    });
  }

  test("no secret is ever named as a public NEXT_PUBLIC_ variable", () => {
    for (const file of files) {
      assert.doesNotMatch(
        readFileSync(file, "utf8"),
        /NEXT_PUBLIC_\w*(SECRET|SERVICE|DATABASE|PASSWORD)/,
        file,
      );
    }
  });

  test("server modules are marked server-only", () => {
    const serverFiles = files.filter((f) =>
      f.includes("/lib/server/") || f.endsWith("/utils/supabase/server.ts")
    );
    assert.ok(serverFiles.length >= 3);
    for (const file of serverFiles) {
      assert.match(readFileSync(file, "utf8"), /^import "server-only";/m, file);
    }
  });
});
