"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export function JobForm() {
  const router = useRouter();
  const [jobUrl, setJobUrl] = useState("");
  const [query, setQuery] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    const response = await fetch("/api/jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobUrl, query, jobDescription }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Could not create job.");
      return;
    }
    router.push(`/jobs/${data.job.id}`);
  }

  return (
    <section className="min-w-0 rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold">Job input</h2>
      <div className="grid gap-3">
        <input
          value={jobUrl}
          onChange={(event) => setJobUrl(event.target.value)}
          placeholder="Public job link"
          className="min-h-10 min-w-0 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-950"
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Role query, e.g. Software Engineer Intern AI/ML Summer 2026"
          className="min-h-10 min-w-0 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-950"
        />
        <textarea
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
          placeholder="Paste job description"
          className="min-h-72 min-w-0 rounded-md border border-neutral-300 p-3 text-sm outline-none focus:border-neutral-950"
        />
      </div>
      <div className="mt-3 flex justify-end">
        <button onClick={submit} className="inline-flex items-center gap-2 rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white">
          Continue
          <ArrowRight size={16} />
        </button>
      </div>
      {error ? <p className="mt-3 break-words text-sm text-red-700">{error}</p> : null}
    </section>
  );
}
