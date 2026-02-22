import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import SignOutButton from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-xl font-bold text-white tracking-tight">
            accepted<span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">.fyi</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Full nav — hidden on mobile */}
            <div className="hidden sm:flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-sm text-slate-400 transition-colors hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/browse"
                className="text-sm text-slate-400 transition-colors hover:text-white"
              >
                Browse
              </Link>
              <Link
                href="/schools"
                className="text-sm text-slate-400 transition-colors hover:text-white"
              >
                Schools
              </Link>
            </div>
            {/* Always visible — Submit CTA + sign out */}
            <Link
              href="/submit"
              className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-lg shadow-violet-600/25 sm:px-4 sm:py-2"
            >
              Submit
            </Link>
            <SignOutButton />
          </div>
        </div>
        {/* Mobile nav — visible only on small screens */}
        <div className="flex items-center justify-center gap-6 border-t border-white/5 px-4 py-2 sm:hidden">
          <Link href="/dashboard" className="text-xs text-slate-400 hover:text-white">
            Dashboard
          </Link>
          <Link href="/browse" className="text-xs text-slate-400 hover:text-white">
            Browse
          </Link>
          <Link href="/schools" className="text-xs text-slate-400 hover:text-white">
            Schools
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-32 sm:px-6 sm:pt-28">{children}</main>
    </div>
  );
}
