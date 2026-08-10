import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Vitest globalSetup: runs once, before any test file is loaded, in the
// process that spawns the test workers — so process.env set here is
// inherited by them. lib/prisma.ts reads DATABASE_URL at import time, so
// this has to happen before any test file (even transitively) imports it.
// Never point at dev.db: a disposable file per run keeps tests isolated
// from local dev data and from each other across CI runs.
export default async function setup() {
  const dir = mkdtempSync(join(tmpdir(), "giftlist-test-"));
  const databaseUrl = `file:${join(dir, "test.db")}`;
  process.env.DATABASE_URL = databaseUrl;

  execSync("npx prisma migrate deploy", {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "inherit",
  });

  return () => {
    rmSync(dir, { recursive: true, force: true });
  };
}
