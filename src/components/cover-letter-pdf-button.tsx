"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";

export function CoverLetterPdfButton({ coverLetterId }: { coverLetterId: string }) {
  const [pdfPath, setPdfPath] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function generatePdf() {
    setBusy(true);
    setMessage("Creating PDF...");
    const response = await fetch(`/api/cover-letters/${coverLetterId}/pdf`, { method: "POST" });
    const data = await response.json();
    setBusy(false);

    if (!response.ok || !data.result?.success) {
      setMessage(data.error ?? data.result?.log ?? "Could not create PDF.");
      return;
    }

    setPdfPath(data.result.pdfPath);
    setMessage("PDF ready.");
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={generatePdf}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        <FileText size={16} />
        Create cover PDF
      </button>
      {pdfPath ? (
        <a
          href={pdfPath}
          download="cover-letter.pdf"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-neutral-300 px-4 py-2 text-sm"
        >
          <Download size={16} />
          Download PDF
        </a>
      ) : null}
      {message ? <p className="break-words text-sm text-neutral-700">{message}</p> : null}
    </div>
  );
}
