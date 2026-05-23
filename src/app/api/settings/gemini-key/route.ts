import { NextResponse } from "next/server";
import { encryptSecret, maskSecret } from "@/lib/crypto";
import { jsonError, parseJson, requireApiUserId } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { geminiKeySchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const auth = await requireApiUserId();
  if (auth.response) return auth.response;

  const body = await parseJson(request);
  const parsed = geminiKeySchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid API key");

  const encrypted = encryptSecret(parsed.data.apiKey);

  await prisma.userSecret.upsert({
    where: { userId_provider: { userId: auth.userId, provider: "gemini" } },
    update: {
      encryptedValue: encrypted.encryptedValue,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      maskedValue: maskSecret(parsed.data.apiKey),
    },
    create: {
      userId: auth.userId,
      provider: "gemini",
      encryptedValue: encrypted.encryptedValue,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      maskedValue: maskSecret(parsed.data.apiKey),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const auth = await requireApiUserId();
  if (auth.response) return auth.response;

  await prisma.userSecret.deleteMany({
    where: { userId: auth.userId, provider: "gemini" },
  });

  return NextResponse.json({ ok: true });
}
