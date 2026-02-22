import { createBrowserClient } from "@supabase/ssr";
import { getPublicConfig } from "@/lib/config";

export function createSupabaseBrowserClient() {
  const { supabase } = getPublicConfig();
  return createBrowserClient(supabase.url, supabase.anonKey);
}
