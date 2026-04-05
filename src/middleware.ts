import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// Matcher is scoped to auth-gated routes only. Public pages, API routes, OG
// cards, robots.txt, sitemap.xml, and static assets do NOT run middleware —
// this keeps Vercel Fluid Active CPU usage low by avoiding a Supabase
// auth.getUser() network call on every anonymous page view / bot crawl.
// Each protected route still performs its own auth check server-side (see
// (dashboard)/layout.tsx and withAuth in lib/api-middleware.ts).
export const config = {
  matcher: [
    "/submit/:path*",
    "/browse/:path*",
    "/dashboard/:path*",
    "/chances/:path*",
  ],
};
