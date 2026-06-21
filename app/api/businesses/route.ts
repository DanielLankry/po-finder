import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPublicReadyBusiness } from "@/lib/public-business";
import type { BusinessSchedule, BusinessWithSchedule, Photo, WeeklyScheduleEntry } from "@/lib/types";

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
    const mine = searchParams.get("mine") === "1";
    const includeSchedule = searchParams.get("includeSchedule") === "1";

    // "mine=1" — return ALL of authenticated user's businesses (active + pending)
    if (mine) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, expires_at, is_active")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return NextResponse.json({ businesses: data ?? [] });
    }

    let query = supabase
      .from("businesses")
      .select(`
        id,
        owner_id,
        name,
        description,
        category,
        address,
        lat,
        lng,
        weekly_hours,
        phone,
        whatsapp,
        website,
        instagram,
        kashrut,
        business_number,
        avg_rating,
        review_count,
        is_active,
        created_at,
        photos(id, business_id, url, is_primary, created_at)
      `)
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

    const scheduleRequest = includeSchedule
      ? (() => {
        const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" }));
        const today = now.toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
        const todayDow = now.getDay();

        return {
          today,
          schedules: Promise.all([
            supabase
              .from("business_schedules")
              .select("id, business_id, date, address, lat, lng, open_time, close_time, note, created_at")
              .eq("date", today),
            supabase
              .from("business_weekly_schedule")
              .select("id, business_id, day_of_week, is_active, open_time, close_time, address, lat, lng, note, created_at, updated_at")
              .eq("day_of_week", todayDow)
              .eq("is_active", true),
          ]),
        };
      })()
      : null;

    const { data, error } = await query;
    if (error) throw error;

    const businesses = ((data ?? []) as BusinessWithSchedule[])
      .map((business) => ({
        ...business,
        photos: ((business.photos ?? []) as Photo[])
          .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
          .slice(0, 1),
      }))
      .filter(isPublicReadyBusiness);

    if (!includeSchedule || businesses.length === 0) {
      return NextResponse.json({ businesses });
    }

    const [{ data: schedData, error: schedError }, { data: weeklyData, error: weeklyError }] =
      await scheduleRequest!.schedules;

    if (schedError) throw schedError;
    if (weeklyError) throw weeklyError;

    const businessIds = new Set(businesses.map((business) => business.id));

    const dailyMap = new Map(
      ((schedData ?? []) as BusinessSchedule[])
        .filter((schedule) => businessIds.has(schedule.business_id))
        .map((schedule) => [schedule.business_id, schedule])
    );
    const weeklyMap = new Map(
      ((weeklyData ?? []) as WeeklyScheduleEntry[])
        .filter((schedule) => businessIds.has(schedule.business_id))
        .map((schedule) => [schedule.business_id, schedule])
    );

    const businessesWithSchedule = businesses.map((business) => {
      const daily = dailyMap.get(business.id);
      const weekly = weeklyMap.get(business.id);
      const todaySchedule: BusinessSchedule | null = daily ?? (weekly ? {
        id: weekly.id,
        business_id: weekly.business_id,
        date: scheduleRequest!.today,
        address: weekly.address,
        lat: weekly.lat,
        lng: weekly.lng,
        open_time: weekly.open_time,
        close_time: weekly.close_time,
        note: weekly.note,
        created_at: weekly.created_at,
      } : null);

      return {
        ...business,
        today_schedule: todaySchedule,
      };
    });

    return NextResponse.json({ businesses: businessesWithSchedule });
  } catch (err) {
    console.error("[/api/businesses] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
