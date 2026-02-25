"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Suspense, useCallback, useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed: "Sign-in failed. Please try again.",
  profile_setup_failed: "Account setup failed. Please try again or contact support.",
};

function LoginForm() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setErrorMessage(ERROR_MESSAGES[errorParam] ?? "Something went wrong. Please try again.");
    }
  }, [searchParams]);
  const supabaseRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);

  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createSupabaseBrowserClient();
    }
    return supabaseRef.current;
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const { error } = await getSupabase().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/callback`,
        },
      });
      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
      }
    } catch {
      setErrorMessage("Failed to initiate sign in. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 rounded-2xl border border-white/5 bg-slate-900/50 p-8 shadow-2xl">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          accepted<span className="text-violet-400">.fyi</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Real admissions data from real students. See what it actually takes
          to get in.
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-400">
          {errorMessage}
        </div>
      )}

      <div className="space-y-4">
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-medium text-slate-200 shadow-sm transition-colors hover:bg-slate-700 disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>
      </div>

      <p className="text-center text-xs text-slate-500">
        By signing in, you agree to share your admissions data to help other
        students. Your identity stays anonymous.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
