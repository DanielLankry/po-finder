import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/reviews?businessId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const businessId = searchParams.get("businessId");

    if (!businessId) {
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
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/reviews
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { business_id, rating, comment, reviewer_name } = body;

    if (!business_id || !rating) {
      return NextResponse.json({ error: "business_id and rating are required" }, { status: 400 });
    }

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating must be between 1 and 5" }, { status: 400 });
    }

    const supabase = await createClient();

    // Try to get authenticated user (optional)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const insertPayload: Record<string, unknown> = {
      business_id,
      rating,
      comment: comment?.trim() || null,
      reviewer_name: reviewer_name?.trim() || null,
    };

    // Only set user_id if authenticated (RLS policy requires it when set)
    if (user) {
      insertPayload.user_id = user.id;
    }

    const { data, error } = await supabase
      .from("reviews")
      .insert(insertPayload)
      .select("id, business_id, rating, comment, reviewer_name, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ review: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
