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
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-xl font-bold">
            accepted<span className="text-blue-600">.fyi</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/browse"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Browse
            </Link>
            <Link
              href="/submit"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Submit
            </Link>
            <Link
              href="/schools"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Schools
            </Link>
            <SignOutButton />
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
