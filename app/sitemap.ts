import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site-config";

const STATIC_ROUTES = [
  { path: "", changeFrequency: "hourly", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.7 },
  { path: "/vendors", changeFrequency: "weekly", priority: 0.7 },
  { path: "/accessibility", changeFrequency: "yearly", priority: 0.3 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/refund", changeFrequency: "yearly", priority: 0.3 },
] as const satisfies ReadonlyArray<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}>;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, created_at")
    .eq("is_verified", true)
    .eq("is_active", true)
    .or(`is_legacy_public.eq.true,expires_at.gt.${new Date().toISOString()}`);

  const businessUrls: MetadataRoute.Sitemap = (businesses ?? []).map((b) => ({
    url: `${SITE_URL}/businesses/${b.id}`,
    lastModified: b.created_at,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const lastModified = new Date();
  const staticUrls: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  return [...staticUrls, ...businessUrls];
}
