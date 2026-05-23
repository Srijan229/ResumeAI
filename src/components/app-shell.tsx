import Link from "next/link";
import { LogOut } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/resumes", label: "Resumes" },
  { href: "/jobs/new", label: "New Job" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({
  children,
  userName,
}: Readonly<{ children: React.ReactNode; userName?: string | null }>) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            ApplyPilot AI
          </Link>
          <nav className="flex items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                {item.label}
              </Link>
            ))}
            <SignOutButton title={`Sign out${userName ? ` ${userName}` : ""}`}>
              <LogOut size={16} />
            </SignOutButton>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
