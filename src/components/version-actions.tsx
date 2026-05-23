"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, Mail } from "lucide-react";
import { CopyButton } from "@/components/copy-button";

export function VersionActions({
  versionId,
  pdfPath,
  latex,
}: {
  versionId: string;
  pdfPath?: string | null;
  latex: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function compile() {
    setBusy(true);
    setMessage("Compiling PDF with Docker...");
    const response = await fetch(`/api/resume-versions/${versionId}/compile`, { method: "POST" });
    const data = await response.json();
    setBusy(false);
    if (!response.ok || !data.result?.success) {
      setMessage(data.error ?? data.result?.log ?? "Compile failed.");
      return;
    }
    setMessage("PDF compiled.");
    router.refresh();
  }

  async function coverLetter() {
    setBusy(true);
    setMessage("Generating cover letter...");
    const response = await fetch(`/api/resume-versions/${versionId}/cover-letter`, { method: "POST" });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(data.error ?? "Cover letter failed.");
      return;
    }
    router.push(`/cover-letters/${data.coverLetter.id}`);
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold">Next steps</h2>
      <div className="flex flex-wrap gap-3">
        <CopyButton text={latex} label="Copy LaTeX" />
        <button disabled={busy} onClick={compile} className="inline-flex items-center gap-2 rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          <FileText size={16} />
          Compile LaTeX to PDF
        </button>
        {pdfPath ? (
          <a href={pdfPath} download className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-4 py-2 text-sm">
            <Download size={16} />
            Download PDF
          </a>
        ) : null}
        <button disabled={busy} onClick={coverLetter} className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-4 py-2 text-sm disabled:opacity-60">
          <Mail size={16} />
          Generate cover letter
        </button>
      </div>
      <p className="mt-3 text-sm text-neutral-700">You can copy the tailored LaTeX, compile it locally to PDF, then download the generated PDF.</p>
      <p className="mt-2 text-sm text-neutral-700">Do you want to generate a cover letter for this job?</p>
      {message ? <p className="mt-3 text-sm text-neutral-700">{message}</p> : null}
    </section>
  );
}
