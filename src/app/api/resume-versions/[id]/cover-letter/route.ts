import { NextResponse } from "next/server";
import { generateCoverLetter } from "@/lib/gemini";
import { jsonError, requireApiUserId } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUserId();
  if (auth.response) return auth.response;

  const { id } = await params;
  const version = await prisma.resumeVersion.findFirst({
    where: { id, userId: auth.userId },
    include: { job: true },
  });
  if (!version) return jsonError("Resume version not found", 404);

  try {
    const content = await generateCoverLetter(auth.userId, JSON.parse(version.analysisJson), version.tailoredLatex);
    const coverLetter = await prisma.coverLetter.create({
      data: {
        userId: auth.userId,
        jobId: version.jobId,
        resumeVersionId: version.id,
        content,
      },
    });

    return NextResponse.json({ coverLetter });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Cover letter generation failed", 500);
  }
}
