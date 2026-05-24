import { AppShell } from "@/components/app-shell";
import { CoverLetterPdfButton } from "@/components/cover-letter-pdf-button";
import { CopyButton } from "@/components/copy-button";
import { DownloadTextButton } from "@/components/download-text-button";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function CoverLetterPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const coverLetter = await prisma.coverLetter.findFirst({
    where: { id, userId: user.id },
    include: { job: true },
  });
  if (!coverLetter) notFound();

  return (
    <AppShell userName={user.name}>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cover letter</h1>
          <p className="mt-1 text-sm text-neutral-600">{coverLetter.job.jobTitle || "Generated letter"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={coverLetter.content} />
          <DownloadTextButton
            text={coverLetter.content}
            filename="cover-letter.txt"
            label="Download cover letter"
          />
        </div>
      </div>
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="rounded-md border border-neutral-300 p-5">
            <pre className="whitespace-pre-wrap break-words text-sm leading-7 text-neutral-800">{coverLetter.content}</pre>
          </div>
        </section>
        <section className="min-w-0 rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold">Export</h2>
          <CoverLetterPdfButton coverLetterId={coverLetter.id} />
        </section>
      </div>
    </AppShell>
  );
}
