import { AppShell } from "@/components/app-shell";
import { SettingsKeyForm } from "@/components/settings-key-form";
import { requireUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <AppShell userName={user.name}>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="mb-6 text-sm text-neutral-600">
        Your Gemini key is encrypted with AES-256-GCM and only used server-side for your requests.
      </p>
      <SettingsKeyForm />
    </AppShell>
  );
}
