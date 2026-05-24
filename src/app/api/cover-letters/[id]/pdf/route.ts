import { NextResponse } from "next/server";
import { coverLetterToLatex, extractContactFromLatex } from "@/lib/cover-letter-pdf";
import { jsonError, requireApiUserId } from "@/lib/http";
import { compileLatexToPdf } from "@/lib/latex";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUserId();
  if (auth.response) return auth.response;

  const { id } = await params;
  const coverLetter = await prisma.coverLetter.findFirst({
    where: { id, userId: auth.userId },
    include: { job: true, resumeVersion: true, user: true },
  });

  if (!coverLetter) return jsonError("Cover letter not found", 404);

  const title = coverLetter.job.companyName
    ? `Cover Letter - ${coverLetter.job.companyName}`
    : "Cover Letter";
  const resumeContact = extractContactFromLatex(coverLetter.resumeVersion.tailoredLatex);
  const result = await compileLatexToPdf(
    auth.userId,
    coverLetterToLatex(coverLetter.content, title, {
      ...resumeContact,
      name: resumeContact.name ?? coverLetter.user.name,
      email: resumeContact.email ?? coverLetter.user.email,
    }),
  );

  return NextResponse.json({ result });
}
