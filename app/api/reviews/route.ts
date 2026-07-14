import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const businessIdSchema = z.string().uuid();
const reviewSchema = z.object({
  business_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(300).nullable().optional(),
  reviewer_name: z.string().trim().max(60).nullable().optional(),
  privacyAccepted: z.literal(true),
});

// GET /api/reviews?businessId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const businessId = searchParams.get("businessId");

    if (!businessIdSchema.safeParse(businessId).success) {
      return NextResponse.json({ error: "businessId is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("id, business_id, rating, comment, reviewer_name, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reviews: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/reviews
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "יש להתחבר כדי להשאיר ביקורת" }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!rateLimit(`reviews:${user.id}:${ip}`, 5, 60_000)) {
      return NextResponse.json({ error: "יותר מדי ניסיונות. נסו שוב בעוד דקה." }, { status: 429 });
    }

    const parsed = reviewSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "פרטי הביקורת אינם תקינים" }, { status: 400 });
    }
    const { business_id, rating, comment, reviewer_name } = parsed.data;

    const insertPayload: Record<string, unknown> = {
      business_id,
      rating,
      comment: comment?.trim() || null,
      reviewer_name: reviewer_name?.trim() || null,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from("reviews")
      .insert(insertPayload)
      .select("id, business_id, rating, comment, reviewer_name, created_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "כבר פרסמתם ביקורת לעסק הזה" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ review: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
