import { AppShell } from "@/components/app-shell";
import { ResumeForm } from "@/components/resume-form";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ResumesPage() {
  const user = await requireUser();
  const resumes = await prisma.resume.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });

  return (
    <AppShell userName={user.name}>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Resumes</h1>
      <p className="mb-6 text-sm text-neutral-600">Paste LaTeX resumes with marker-based editable blocks.</p>
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <ResumeForm />
        <section className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold">Saved resumes</h2>
          <div className="space-y-2">
            {resumes.length ? resumes.map((resume) => (
              <div key={resume.id} className="rounded-md border border-neutral-200 p-3">
                <p className="font-medium">{resume.name}</p>
                <p className="text-xs text-neutral-500">Updated {resume.updatedAt.toLocaleDateString()}</p>
              </div>
            )) : <p className="text-sm text-neutral-500">No resumes saved.</p>}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
