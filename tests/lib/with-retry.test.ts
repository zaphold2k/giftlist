import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@/app/generated/prisma/client";
import { withRetry } from "@/lib/with-retry";

function writeConflict() {
  return new Prisma.PrismaClientKnownRequestError("write conflict", {
    code: "P2034",
    clientVersion: "test",
  });
}

describe("withRetry", () => {
  it("retries on a P2034 write conflict and returns the eventual success", async () => {
    let calls = 0;
    const result = await withRetry(async () => {
      calls++;
      if (calls < 3) throw writeConflict();
      return "ok";
    });
    expect(result).toBe("ok");
    expect(calls).toBe(3);
  });

  it("retries on a raw SQLITE_BUSY error", async () => {
    let calls = 0;
    const result = await withRetry(async () => {
      calls++;
      if (calls < 2) throw new Error("SQLITE_BUSY: database is locked");
      return "ok";
    });
    expect(result).toBe("ok");
    expect(calls).toBe(2);
  });

  it("does not retry a non-retryable error", async () => {
    const fn = vi.fn(async () => {
      throw new Error("boom");
    });
    await expect(withRetry(fn)).rejects.toThrow("boom");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("gives up after the configured number of attempts", async () => {
    const fn = vi.fn(async () => {
      throw writeConflict();
    });
    await expect(withRetry(fn, 2)).rejects.toThrow("write conflict");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
