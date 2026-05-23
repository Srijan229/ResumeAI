"use client";

import { Copy } from "lucide-react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text)}
      className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-4 py-2 text-sm"
    >
      <Copy size={16} />
      {label}
    </button>
  );
}
