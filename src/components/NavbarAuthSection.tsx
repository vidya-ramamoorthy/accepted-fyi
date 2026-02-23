"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NavbarAuthSection() {
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createSupabaseBrowserClient();
    }
    return supabaseRef.current;
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await getSupabase().auth.getSession();
      setIsAuthenticated(!!session);
      setIsLoading(false);
    };
    checkAuth();
  }, [getSupabase]);

  const handleSignOut = async () => {
    await getSupabase().auth.signOut();
    setIsAuthenticated(false);
    router.push("/");
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="h-9 w-20 animate-pulse rounded-full bg-slate-800" />
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-5 sm:flex">
          <Link href="/dashboard" className="text-sm text-slate-400 transition-colors hover:text-white">
            Dashboard
          </Link>
          <Link href="/browse" className="text-sm text-slate-400 transition-colors hover:text-white">
            Browse
          </Link>
          <Link href="/chances" className="text-sm text-slate-400 transition-colors hover:text-white">
            Chances
          </Link>
        </div>
        <Link
          href="/submit"
          className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-lg shadow-violet-600/25 sm:px-4 sm:py-2"
        >
          Submit
        </Link>
        <button
          onClick={handleSignOut}
          className="text-sm text-slate-500 transition-colors hover:text-white"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link href="/schools" className="hidden text-sm text-slate-400 transition-colors hover:text-white sm:inline">
        All Schools
      </Link>
      <Link
        href="/login"
        className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition-all hover:bg-slate-100"
      >
        Sign In
      </Link>
    </div>
  );
}
