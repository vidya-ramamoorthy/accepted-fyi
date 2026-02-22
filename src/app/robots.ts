import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/submit/", "/login/", "/callback/"],
    },
    sitemap: "https://accepted.fyi/sitemap.xml",
  };
}
