"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

export function ResumeForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [latex, setLatex] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    const response = await fetch("/api/resumes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, latex }),
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Could not save resume.");
      return;
    }
    const data = await response.json();
    setName("");
    setLatex("");
    if (data.markerPrep?.insertedMarkers) {
      setError("Saved. ApplyPilot automatically added editable markers to a working copy of this resume.");
    }
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold">Paste LaTeX resume</h2>
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Resume name"
        className="mb-3 min-h-10 w-full rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-950"
      />
      <textarea
        value={latex}
        onChange={(event) => setLatex(event.target.value)}
        placeholder="% === SUMMARY_START ==="
        className="min-h-80 w-full rounded-md border border-neutral-300 p-3 font-mono text-xs outline-none focus:border-neutral-950"
      />
      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-neutral-600">Editable content must be wrapped in marker blocks.</p>
        <button onClick={submit} className="inline-flex items-center gap-2 rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white">
          <Save size={16} />
          Save resume
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-neutral-700">{error}</p> : null}
    </section>
  );
}
