"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, Wand2 } from "lucide-react";

export function JobActions({ jobId, resumes }: { jobId: string; resumes: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [resumeId, setResumeId] = useState(resumes[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function analyze() {
    setBusy(true);
    setMessage("Analyzing job...");
    const response = await fetch(`/api/jobs/${jobId}/analyze`, { method: "POST" });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(data.error ?? "Analysis failed.");
      return;
    }
    setMessage("Job analysis saved.");
    router.refresh();
  }

  async function tailor() {
    setBusy(true);
    setMessage("Tailoring resume...");
    const response = await fetch(`/api/jobs/${jobId}/tailor-resume`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ resumeId }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(data.error ?? "Tailoring failed.");
      return;
    }
    router.push(`/resume-versions/${data.version.id}`);
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold">Actions</h2>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button disabled={busy} onClick={analyze} className="inline-flex items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          <Brain size={16} />
          Analyze job
        </button>
        <select value={resumeId} onChange={(event) => setResumeId(event.target.value)} className="min-h-10 rounded-md border border-neutral-300 px-3 text-sm">
          {resumes.map((resume) => (
            <option key={resume.id} value={resume.id}>
              {resume.name}
            </option>
          ))}
        </select>
        <button disabled={busy || !resumeId} onClick={tailor} className="inline-flex items-center justify-center gap-2 rounded-md border border-neutral-300 px-4 py-2 text-sm disabled:opacity-60">
          <Wand2 size={16} />
          Tailor resume
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-neutral-700">{message}</p> : null}
    </section>
  );
}
