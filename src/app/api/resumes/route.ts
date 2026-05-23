import { NextResponse } from "next/server";
import { jsonError, parseJson, requireApiUserId } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { prepareResumeLatex } from "@/lib/resume-markers";
import { resumeSchema } from "@/lib/schemas";

export async function GET() {
  const auth = await requireApiUserId();
  if (auth.response) return auth.response;

  const resumes = await prisma.resume.findMany({
    where: { userId: auth.userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ resumes });
}

export async function POST(request: Request) {
  const auth = await requireApiUserId();
  if (auth.response) return auth.response;

  const body = await parseJson(request);
  const parsed = resumeSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid resume");
  const prepared = prepareResumeLatex(parsed.data.latex);

  const resume = await prisma.resume.create({
    data: {
      userId: auth.userId,
      name: parsed.data.name,
      originalLatex: parsed.data.latex,
      currentLatex: prepared.latex,
    },
  });

  return NextResponse.json({
    resume,
    markerPrep: {
      insertedMarkers: prepared.insertedMarkers,
      warnings: prepared.warnings,
    },
  });
}
