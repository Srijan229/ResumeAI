import { AppShell } from "@/components/app-shell";
import { JobActions } from "@/components/job-actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [job, resumes] = await Promise.all([
    prisma.job.findFirst({ where: { id, userId: user.id } }),
    prisma.resume.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, select: { id: true, name: true } }),
  ]);

  if (!job) notFound();

  const analysis = job.analysisJson ? JSON.parse(job.analysisJson) : null;
  const company = job.companyJson ? JSON.parse(job.companyJson) : null;

  return (
    <AppShell userName={user.name}>
      <div className="mb-6 min-w-0">
        <h1 className="break-words text-2xl font-semibold tracking-tight">{job.jobTitle || "Job research"}</h1>
        <p className="mt-1 break-words text-sm text-neutral-600">{job.companyName || "Company pending"} {job.location ? `- ${job.location}` : ""}</p>
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          {analysis ? (
            <>
              <section className="min-w-0 rounded-lg border border-neutral-200 bg-white p-5">
                <h2 className="mb-3 text-lg font-semibold">Job summary</h2>
                <p className="break-words text-sm leading-6 text-neutral-700">{analysis.summary}</p>
                <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-3">
                  <Metric label="Match score" value={`${analysis.matchScore ?? 0}%`} />
                  <Metric label="Employment" value={analysis.employmentType || "Unknown"} />
                  <Metric label="Location" value={analysis.location || "Unknown"} />
                </div>
              </section>
              <section className="min-w-0 rounded-lg border border-neutral-200 bg-white p-5">
                <h2 className="mb-3 text-lg font-semibold">Skills and strategy</h2>
                <SkillBlock title="Required" items={analysis.requiredSkills} />
                <SkillBlock title="Preferred" items={analysis.preferredSkills} />
                <SkillBlock title="Missing" items={analysis.missingSkills} />
                <div className="mt-4 rounded-md bg-neutral-50 p-3 text-sm">
                  <p className="break-words font-medium">{analysis.resumeStrategy?.recommendedProfile}</p>
                  <p className="mt-1 break-words text-neutral-600">Emphasize: {(analysis.resumeStrategy?.sectionsToEmphasize ?? []).join(", ") || "None specified"}</p>
                </div>
              </section>
              <section className="min-w-0 rounded-lg border border-neutral-200 bg-white p-5">
                <h2 className="mb-3 text-lg font-semibold">Work authorization</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Signal label="Sponsorship" value={analysis.workAuthorization?.sponsorshipLikelihood ?? "unknown"} />
                  <Signal label="Clearance" value={analysis.workAuthorization?.clearanceRequired ?? "unknown"} />
                </div>
                <p className="mt-3 break-words text-sm leading-6 text-neutral-700">
                  {analysis.workAuthorization?.recommendation ?? "No clear work authorization or clearance signal found in the job text."}
                </p>
                {analysis.workAuthorization?.evidence?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {analysis.workAuthorization.evidence.map((item: string) => (
                      <span key={item} className="max-w-full break-words rounded-md bg-neutral-100 px-2 py-1 text-xs text-neutral-700">
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}
              </section>
              {company ? (
                <section className="min-w-0 rounded-lg border border-neutral-200 bg-white p-5">
                  <h2 className="mb-3 text-lg font-semibold">Company research</h2>
                  <p className="break-words text-sm leading-6 text-neutral-700">{company.whyThisCompany}</p>
                  <p className="mt-3 break-words text-sm text-neutral-600">{company.engineeringRelevance}</p>
                  {company.sources?.length ? <p className="mt-3 break-all text-xs text-neutral-500">Sources: {company.sources.join(", ")}</p> : null}
                </section>
              ) : null}
            </>
          ) : (
            <section className="min-w-0 rounded-lg border border-neutral-200 bg-white p-5">
              <h2 className="mb-3 text-lg font-semibold">Ready to analyze</h2>
              <p className="text-sm text-neutral-600">Run analysis to produce job summary, skills, match score, company notes, and resume strategy.</p>
            </section>
          )}
        </div>
        <JobActions jobId={job.id} resumes={resumes} />
      </div>
    </AppShell>
  );
}

function Signal({ label, value }: { label: string; value: "yes" | "no" | "unknown" }) {
  const styles = {
    yes: "border-emerald-200 bg-emerald-50 text-emerald-900",
    no: "border-red-200 bg-red-50 text-red-900",
    unknown: "border-amber-200 bg-amber-50 text-amber-900",
  };

  const labels = {
    yes: label === "Clearance" ? "Required" : "Likely yes",
    no: label === "Clearance" ? "Not indicated" : "Likely no",
    unknown: "Unknown",
  };

  return (
    <div className={`rounded-md border p-3 ${styles[value]}`}>
      <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-sm font-semibold">{labels[value]}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-neutral-200 p-3">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 break-words font-medium">{value}</p>
    </div>
  );
}

function SkillBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-3">
      <p className="mb-2 text-sm font-medium">{title}</p>
      <div className="flex min-w-0 flex-wrap gap-2">
        {items?.length ? items.map((item) => (
          <span key={item} className="max-w-full break-words rounded-md bg-neutral-100 px-2 py-1 text-xs text-neutral-700">{item}</span>
        )) : <span className="text-sm text-neutral-500">None listed</span>}
      </div>
    </div>
  );
}
