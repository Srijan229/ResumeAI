import { NextResponse } from "next/server";
import { tailorResume } from "@/lib/gemini";
import { jsonError, parseJson, requireApiUserId } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import {
  extractMarkerBlocks,
  prepareResumeLatex,
  restrictEditableMarkers,
  validateTemplatePreserved,
} from "@/lib/resume-markers";
import { tailorSchema } from "@/lib/schemas";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUserId();
  if (auth.response) return auth.response;

  const body = await parseJson(request);
  const parsed = tailorSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid resume selection");

  const { id } = await params;
  const [job, resume] = await Promise.all([
    prisma.job.findFirst({ where: { id, userId: auth.userId } }),
    prisma.resume.findFirst({ where: { id: parsed.data.resumeId, userId: auth.userId } }),
  ]);

  if (!job) return jsonError("Job not found", 404);
  if (!resume) return jsonError("Resume not found", 404);
  if (!job.analysisJson) return jsonError("Analyze the job before tailoring a resume.");

  try {
    const prepared = extractMarkerBlocks(resume.currentLatex).length
      ? { latex: resume.currentLatex, insertedMarkers: false }
      : prepareResumeLatex(resume.currentLatex);

    if (prepared.insertedMarkers) {
      await prisma.resume.update({
        where: { id: resume.id },
        data: { currentLatex: prepared.latex },
      });
    }

    const restrictedLatex = restrictEditableMarkers(prepared.latex);
    const analysis = JSON.parse(job.analysisJson);
    const result = await tailorResume(auth.userId, restrictedLatex, analysis);
    const validation = validateTemplatePreserved(restrictedLatex, result.tailoredLatex);
    const changeSummary = {
      ...result.changeSummary,
      warnings: [...(result.changeSummary.warnings ?? []), ...validation.warnings],
    };

    if (!validation.valid) {
      return jsonError("Tailoring changed content outside editable markers. No version was saved.", 422);
    }

    const version = await prisma.resumeVersion.create({
      data: {
        userId: auth.userId,
        resumeId: resume.id,
        jobId: job.id,
        tailoredLatex: result.tailoredLatex,
        changeSummaryJson: JSON.stringify(changeSummary),
        analysisJson: job.analysisJson,
      },
    });

    return NextResponse.json({ version });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Resume tailoring failed", 500);
  }
}
