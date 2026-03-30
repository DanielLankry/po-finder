import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional().nullable(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "event_date must be YYYY-MM-DD"),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "start_time must be HH:MM").optional().nullable(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "end_time must be HH:MM").optional().nullable(),
  price: z.number().min(0).optional().nullable(),
  image_url: z.string().url().optional().nullable(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });

  const { data, error } = await supabase
    .from("business_events")
    .select("*")
    .eq("business_id", id)
    .gte("event_date", todayStr)
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { title, description, event_date, start_time, end_time, price, image_url } = parsed.data;

  const { data, error } = await supabase
    .from("business_events")
    .insert({
      business_id: id,
      title,
      description: description ?? null,
      event_date,
      start_time: start_time ?? null,
      end_time: end_time ?? null,
      price: price ?? null,
      image_url: image_url ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
