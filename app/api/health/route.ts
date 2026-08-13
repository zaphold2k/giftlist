import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Replaces `curl /` as the Docker smoke-test target (see ROADMAP.md Fase 5)
// and gives deploy tooling a real readiness check instead of "the homepage
// happened to render".
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
