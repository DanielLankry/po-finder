import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = req.nextUrl;

    const q = searchParams.get("q")?.trim() || "";
    const bbox = searchParams.get("bbox"); // "lat1,lng1,lat2,lng2"
    const category = searchParams.get("category");
    const kashrut = searchParams.get("kashrut");
    const minRating = searchParams.get("minRating");

    let query = supabase
      .from("businesses")
      .select("*, photos(url, is_primary)")
      .eq("is_active", true);

    // Full-text search via tsvector
    if (q) {
      query = query
        .textSearch("search_vector", q, { type: "plain", config: "simple" })
        .order("avg_rating", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    // Optional filters
    if (category && category !== "all") {
      query = query.eq("category", category);
    }
    if (kashrut && kashrut !== "all") {
      query = query.eq("kashrut", kashrut);
    }
    if (minRating) {
      query = query.gte("avg_rating", parseFloat(minRating));
    }

    // Bounding-box filter (lat1,lng1,lat2,lng2) — uses business base lat/lng
    if (bbox) {
      const parts = bbox.split(",").map(Number);
      if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
        const [lat1, lng1, lat2, lng2] = parts;
        const minLat = Math.min(lat1, lat2);
        const maxLat = Math.max(lat1, lat2);
        const minLng = Math.min(lng1, lng2);
        const maxLng = Math.max(lng1, lng2);
        query = query
          .gte("lat", minLat)
          .lte("lat", maxLat)
          .gte("lng", minLng)
          .lte("lng", maxLng);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ businesses: data ?? [] });
  } catch (err) {
    console.error("[/api/businesses] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
