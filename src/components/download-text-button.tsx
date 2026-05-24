"use client";

import { Download } from "lucide-react";

export function DownloadTextButton({
  text,
  filename,
  label,
}: {
  text: string;
  filename: string;
  label: string;
}) {
  function download() {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-neutral-300 px-4 py-2 text-sm"
    >
      <Download size={16} />
      {label}
    </button>
  );
}
