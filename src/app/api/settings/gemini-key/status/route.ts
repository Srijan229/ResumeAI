import { NextResponse } from "next/server";
import { requireApiUserId } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireApiUserId();
  if (auth.response) return auth.response;

  const secret = await prisma.userSecret.findUnique({
    where: { userId_provider: { userId: auth.userId, provider: "gemini" } },
    select: { maskedValue: true },
  });

  return NextResponse.json({ exists: Boolean(secret), maskedValue: secret?.maskedValue ?? null });
}
