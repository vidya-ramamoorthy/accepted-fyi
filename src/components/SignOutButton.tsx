"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);

  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createSupabaseBrowserClient();
    }
    return supabaseRef.current;
  }, []);

  const handleSignOut = async () => {
    await getSupabase().auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-gray-600 hover:text-gray-900"
    >
      Sign Out
    </button>
  );
}
