import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, created_at")
    .eq("is_verified", true)
    .eq("is_active", true)
    .or(`is_legacy_public.eq.true,expires_at.gt.${new Date().toISOString()}`);

  const businessUrls: MetadataRoute.Sitemap = (businesses ?? []).map((b) => ({
    url: `https://pokarov.co.il/businesses/${b.id}`,
    lastModified: b.created_at,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [
    {
      url: "https://pokarov.co.il",
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: "https://pokarov.co.il/about",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...businessUrls,
  ];
}
