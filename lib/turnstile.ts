export class TurnstileError extends Error {
  constructor() {
    super("No pudimos verificar que sos una persona. Intenta de nuevo.");
    this.name = "TurnstileError";
  }
}

// Turnstile is opt-in: without a secret configured (e.g. a contributor
// running the app locally without Cloudflare credentials), the widget is
// hidden and the server doesn't require a token — see app/l/[slug]/page.tsx
// and app/l/[slug]/actions.ts.
export function isTurnstileConfigured(): boolean {
  return !!process.env.TURNSTILE_SECRET_KEY;
}

// First outbound network call in this project — see AGENTS.md.
export async function verifyTurnstile(token: string, remoteIp?: string): Promise<void> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) throw new TurnstileError();
  if (!token) throw new TurnstileError();

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  if (!res.ok) throw new TurnstileError();

  const data: { success: boolean } = await res.json();
  if (!data.success) throw new TurnstileError();
}
