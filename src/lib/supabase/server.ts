import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServerConfig } from "@/lib/config";

export async function createSupabaseServerClient() {
  const { supabase } = getServerConfig();
  const cookieStore = await cookies();

  return createServerClient(
    supabase.url,
    supabase.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method is called from a Server Component
            // where cookies can't be set. This can be ignored when
            // we have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}
