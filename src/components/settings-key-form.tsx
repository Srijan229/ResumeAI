"use client";

import { useEffect, useState } from "react";
import { KeyRound, Trash2 } from "lucide-react";

export function SettingsKeyForm() {
  const [apiKey, setApiKey] = useState("");
  const [masked, setMasked] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function refreshStatus() {
    const response = await fetch("/api/settings/gemini-key/status");
    const data = await response.json();
    setMasked(data.maskedValue);
  }

  useEffect(() => {
    fetch("/api/settings/gemini-key/status")
      .then((response) => response.json())
      .then((data) => setMasked(data.maskedValue))
      .catch(() => setMasked(null));
  }, []);

  async function save() {
    setMessage("");
    const response = await fetch("/api/settings/gemini-key", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ apiKey }),
    });
    if (!response.ok) {
      const data = await response.json();
      setMessage(data.error ?? "Could not save key.");
      return;
    }
    setApiKey("");
    setMessage("Gemini key saved.");
    await refreshStatus();
  }

  async function remove() {
    setMessage("");
    await fetch("/api/settings/gemini-key", { method: "DELETE" });
    setMasked(null);
    setMessage("Gemini key deleted.");
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <KeyRound size={18} />
        <h2 className="text-lg font-semibold">Gemini API key</h2>
      </div>
      <div className="mb-4 rounded-md bg-neutral-50 p-3 text-sm text-neutral-700">
        Current status: {masked ? <span className="font-mono">{masked}</span> : "No key saved"}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          type="password"
          placeholder="Paste Gemini API key"
          className="min-h-10 flex-1 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-950"
        />
        <button onClick={save} className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white">
          Save key
        </button>
        <button
          onClick={remove}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-neutral-300 px-4 py-2 text-sm"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-neutral-700">{message}</p> : null}
    </section>
  );
}
