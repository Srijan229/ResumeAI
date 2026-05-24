import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await requireUser();
  const [resumes, jobs, versions, secret] = await Promise.all([
    prisma.resume.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 5 }),
    prisma.job.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 5 }),
    prisma.resumeVersion.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5, include: { job: true } }),
    prisma.userSecret.findUnique({ where: { userId_provider: { userId: user.id, provider: "gemini" } } }),
  ]);

  return (
    <AppShell userName={user.name}>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-600">Research jobs, tailor LaTeX, compile PDFs, and manually apply.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-md border border-neutral-300 px-4 py-2 text-sm" href="/resumes">
            Add resume
          </Link>
          <Link className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white" href="/jobs/new">
            Start job
          </Link>
        </div>
      </div>

      {!secret ? (
        <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Add your Gemini API key in <Link className="underline" href="/settings">Settings</Link> before analysis or generation.
        </div>
      ) : null}

      <ol className="mb-6 grid gap-2 md:grid-cols-4">
        {["Resume", "Job analysis", "Tailoring", "PDF + cover letter"].map((step, index) => (
          <li key={step} className="rounded-md border border-neutral-200 bg-white p-3 text-sm">
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-950 text-xs text-white">{index + 1}</span>
            {step}
          </li>
        ))}
      </ol>

      <div className="grid min-w-0 gap-5 lg:grid-cols-3">
        <section className="min-w-0 rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 font-semibold">Recent resumes</h2>
          <List items={resumes.map((resume) => resume.name)} empty="No resumes yet" />
        </section>
        <section className="min-w-0 rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 font-semibold">Recent jobs</h2>
          <div className="space-y-2">
            {jobs.length ? jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="block break-words rounded-md border border-neutral-200 p-3 text-sm hover:bg-neutral-50">
                {job.jobTitle || job.companyName || "Untitled job"}
              </Link>
            )) : <p className="text-sm text-neutral-500">No jobs yet</p>}
          </div>
        </section>
        <section className="min-w-0 rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 font-semibold">Resume versions</h2>
          <div className="space-y-2">
            {versions.length ? versions.map((version) => (
              <Link key={version.id} href={`/resume-versions/${version.id}`} className="block break-words rounded-md border border-neutral-200 p-3 text-sm hover:bg-neutral-50">
                {version.job.jobTitle || "Tailored resume"}
              </Link>
            )) : <p className="text-sm text-neutral-500">No versions yet</p>}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function List({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <p className="text-sm text-neutral-500">{empty}</p>;
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item} className="break-words rounded-md border border-neutral-200 p-3 text-sm">
          {item}
        </div>
      ))}
    </div>
  );
}
