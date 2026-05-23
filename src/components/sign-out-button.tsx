"use client";

import { signOut } from "next-auth/react";

export function SignOutButton({
  children,
  title,
}: Readonly<{ children: React.ReactNode; title: string }>) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-100"
      title={title}
    >
      {children}
    </button>
  );
}
