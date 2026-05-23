"use client";

import { signIn } from "next-auth/react";
import { LogIn } from "lucide-react";

export function SignInButton({ disabled = false }: { disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      className="inline-flex items-center gap-2 rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
    >
      <LogIn size={16} />
      Continue with Google
    </button>
  );
}
