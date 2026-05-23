import { NextResponse } from "next/server";
import { shortenEditableBlocks } from "@/lib/gemini";
import { jsonError, requireApiUserId } from "@/lib/http";
import { compileLatexToPdf } from "@/lib/latex";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUserId();
  if (auth.response) return auth.response;

  const { id } = await params;
  const version = await prisma.resumeVersion.findFirst({ where: { id, userId: auth.userId } });
  if (!version) return jsonError("Resume version not found", 404);

  let result = await compileLatexToPdf(auth.userId, version.tailoredLatex);
  let latex = version.tailoredLatex;

  if (result.success && result.pageCount > 1) {
    try {
      const shortened = await shortenEditableBlocks(auth.userId, version.tailoredLatex, JSON.parse(version.analysisJson));
      latex = shortened.latex;
      result = await compileLatexToPdf(auth.userId, latex);
      result.warnings.push(...shortened.warnings);
    } catch {
      result.warnings.push("Automatic one-page shortening could not be completed.");
    }
  }

  await prisma.resumeVersion.update({
    where: { id: version.id },
    data: {
      tailoredLatex: latex,
      pdfPath: result.success ? result.pdfPath : null,
      compileLog: result.log,
    },
  });

  return NextResponse.json({ result });
}
