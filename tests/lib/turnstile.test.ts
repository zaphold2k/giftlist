import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TurnstileError, isTurnstileConfigured, verifyTurnstile } from "@/lib/turnstile";

const ORIGINAL_SECRET = process.env.TURNSTILE_SECRET_KEY;

afterEach(() => {
  process.env.TURNSTILE_SECRET_KEY = ORIGINAL_SECRET;
  vi.unstubAllGlobals();
});

describe("isTurnstileConfigured", () => {
  it("is false without TURNSTILE_SECRET_KEY", () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    expect(isTurnstileConfigured()).toBe(false);
  });

  it("is true once TURNSTILE_SECRET_KEY is set", () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    expect(isTurnstileConfigured()).toBe(true);
  });
});

describe("verifyTurnstile", () => {
  it("throws without making a network call when unconfigured", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(verifyTurnstile("token")).rejects.toThrow(TurnstileError);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("throws without making a network call for an empty token", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(verifyTurnstile("")).rejects.toThrow(TurnstileError);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  describe("with a configured secret", () => {
    beforeEach(() => {
      process.env.TURNSTILE_SECRET_KEY = "secret";
    });

    it("resolves when Cloudflare reports success", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) })
      );
      await expect(verifyTurnstile("token", "1.2.3.4")).resolves.toBeUndefined();
    });

    it("throws when Cloudflare reports failure", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: false }) })
      );
      await expect(verifyTurnstile("token")).rejects.toThrow(TurnstileError);
    });

    it("throws when the request itself fails", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
      await expect(verifyTurnstile("token")).rejects.toThrow(TurnstileError);
    });
  });
});
