import { NextResponse } from "next/server";
import { analyzeJob, researchCompany } from "@/lib/gemini";
import { jsonError, requireApiUserId } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUserId();
  if (auth.response) return auth.response;

  const { id } = await params;
  const job = await prisma.job.findFirst({ where: { id, userId: auth.userId } });
  if (!job) return jsonError("Job not found", 404);

  try {
    const analysis = await analyzeJob(auth.userId, job.jobDescription);
    const company = analysis.companyName
      ? await researchCompany(auth.userId, analysis.companyName, job.jobDescription, job.jobUrl ?? "")
      : null;

    await prisma.job.update({
      where: { id: job.id },
      data: {
        companyName: analysis.companyName,
        jobTitle: analysis.jobTitle,
        location: analysis.location,
        analysisJson: JSON.stringify(analysis),
        companyJson: company ? JSON.stringify(company) : null,
      },
    });

    return NextResponse.json({ analysis, company });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Analysis failed", 500);
  }
}
