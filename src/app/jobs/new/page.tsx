import { AppShell } from "@/components/app-shell";
import { JobForm } from "@/components/job-form";
import { requireUser } from "@/lib/auth";

export default async function NewJobPage() {
  const user = await requireUser();

  return (
    <AppShell userName={user.name}>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">New job</h1>
      <p className="mb-6 text-sm text-neutral-600">
        Use a public page, pasted job description, or role query. ApplyPilot never logs in to job platforms or submits applications.
      </p>
      <JobForm />
    </AppShell>
  );
}
