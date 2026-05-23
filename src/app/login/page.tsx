import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SignInButton } from "@/components/sign-in-button";
import { authOptions } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/dashboard");

  const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <section className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-8">
        <p className="mb-2 text-sm font-medium text-neutral-500">ApplyPilot AI</p>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in to tailor resumes</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          Use Google login to keep resumes, jobs, and encrypted Gemini settings isolated to your account.
        </p>
        {!googleConfigured ? (
          <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            Google OAuth is not configured yet. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`, then restart `npm run dev`.
          </div>
        ) : null}
        <div className="mt-6">
          <SignInButton disabled={!googleConfigured} />
        </div>
      </section>
    </main>
  );
}
