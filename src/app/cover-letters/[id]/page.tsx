import { AppShell } from "@/components/app-shell";
import { CopyButton } from "@/components/copy-button";
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
        <CopyButton text={coverLetter.content} />
      </div>
      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <pre className="whitespace-pre-wrap text-sm leading-7 text-neutral-800">{coverLetter.content}</pre>
      </section>
    </AppShell>
  );
}
