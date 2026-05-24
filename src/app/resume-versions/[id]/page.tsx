import { diffLines } from "diff";
import { AppShell } from "@/components/app-shell";
import { VersionActions } from "@/components/version-actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ResumeVersionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const version = await prisma.resumeVersion.findFirst({
    where: { id, userId: user.id },
    include: { resume: true, job: true },
  });
  if (!version) notFound();

  const changeSummary = JSON.parse(version.changeSummaryJson);
  const analysis = JSON.parse(version.analysisJson);
  const diff = diffLines(version.resume.currentLatex, version.tailoredLatex);

  return (
    <AppShell userName={user.name}>
      <div className="mb-6 min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">Tailored resume</h1>
        <p className="mt-1 break-words text-sm text-neutral-600">{analysis.jobTitle || version.job.jobTitle || "Job"} at {analysis.companyName || version.job.companyName || "company"}</p>
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          {changeSummary.warnings?.length ? (
            <div className="break-words rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {changeSummary.warnings.join(" ")}
            </div>
          ) : null}
          <section className="min-w-0 rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-semibold">Resume changes made</h2>
            <div className="space-y-3">
              {changeSummary.changedBlocks?.length ? changeSummary.changedBlocks.map((block: { block: string; changes: Array<{ before: string; after: string; reason: string }> }) => (
                <div key={block.block} className="min-w-0 rounded-md border border-neutral-200 p-3">
                  <p className="break-words font-mono text-sm font-medium">{block.block}</p>
                  {block.changes.map((change, index) => (
                    <div key={`${block.block}-${index}`} className="mt-2 min-w-0 text-sm text-neutral-700">
                      <p className="break-words"><span className="font-medium">Before:</span> {change.before}</p>
                      <p className="break-words"><span className="font-medium">After:</span> {change.after}</p>
                      <p className="break-words text-neutral-500">{change.reason}</p>
                    </div>
                  ))}
                </div>
              )) : <p className="text-sm text-neutral-500">No changes reported.</p>}
            </div>
          </section>
          <section className="min-w-0 rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-semibold">Diff viewer</h2>
            <pre className="max-h-96 max-w-full overflow-auto rounded-md bg-neutral-950 p-3 text-xs leading-5 text-neutral-100">
              {diff.map((part, index) => (
                <span key={index} className={part.added ? "text-emerald-300" : part.removed ? "text-red-300" : ""}>
                  {part.value}
                </span>
              ))}
            </pre>
          </section>
          <section className="min-w-0 rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-semibold">Tailored LaTeX preview</h2>
            <pre className="max-h-[520px] max-w-full overflow-auto rounded-md bg-neutral-50 p-3 font-mono text-xs leading-5 text-neutral-800">
              {version.tailoredLatex}
            </pre>
          </section>
          {version.pdfPath ? (
            <section className="min-w-0 rounded-lg border border-neutral-200 bg-white p-5">
              <h2 className="mb-3 text-lg font-semibold">PDF preview</h2>
              <iframe src={version.pdfPath} className="h-[640px] w-full max-w-full rounded-md border border-neutral-200" />
            </section>
          ) : null}
        </div>
        <VersionActions versionId={version.id} pdfPath={version.pdfPath} latex={version.tailoredLatex} />
      </div>
    </AppShell>
  );
}
