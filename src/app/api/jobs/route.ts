import { NextResponse } from "next/server";
import { fetchPublicPageText } from "@/lib/company-fetch";
import { jsonError, parseJson, requireApiUserId } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { jobSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const auth = await requireApiUserId();
  if (auth.response) return auth.response;

  const body = await parseJson(request);
  const parsed = jobSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid job input");

  const jobUrl = parsed.data.jobUrl || null;
  const fetched = jobUrl ? await fetchPublicPageText(jobUrl) : null;
  const content = [parsed.data.jobDescription, parsed.data.query, fetched?.text].filter(Boolean).join("\n\n");

  if (!content.trim()) {
    return jsonError("Paste a job description, provide a public job link, or enter a role query.");
  }

  const job = await prisma.job.create({
    data: {
      userId: auth.userId,
      jobDescription: content,
      jobUrl,
      source: jobUrl ? "public_url" : parsed.data.query ? "query" : "pasted_description",
      companyName: "",
      jobTitle: parsed.data.query ?? "",
    },
  });

  return NextResponse.json({ job, warning: fetched?.warning ?? "" });
}
