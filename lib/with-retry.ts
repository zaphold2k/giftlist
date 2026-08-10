import { Prisma } from "@/app/generated/prisma/client";

function isRetryableError(error: unknown): boolean {
  // P2034: transaction write conflict / deadlock. Also cover raw SQLITE_BUSY
  // surfaced by the driver if the busy timeout is exhausted.
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2034";
  }
  return error instanceof Error && /SQLITE_BUSY/.test(error.message);
}

export async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryableError(error) || i === attempts - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 50 * (i + 1)));
    }
  }
  throw lastError;
}
