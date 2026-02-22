import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { findOrCreateUser } from "@/lib/db/queries/users";
import { extractUserProfileData, sanitizeRedirectPath } from "@/lib/utils/auth-helpers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawRedirect = searchParams.get("redirect") ?? "/browse";
  const safeRedirectPath = sanitizeRedirectPath(rawRedirect);

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        try {
          await findOrCreateUser(extractUserProfileData(user));
        } catch (profileError) {
          console.error("Profile creation failed during auth callback:", profileError);
          return NextResponse.redirect(
            `${origin}/login?error=profile_setup_failed`
          );
        }
      }

      return NextResponse.redirect(`${origin}${safeRedirectPath}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
