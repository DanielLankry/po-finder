import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

function checkAdmin(req: NextRequest) {
  const session = req.cookies.get("admin_session")?.value;
  return session && session === process.env.ADMIN_SECRET;
}

const couponSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  type: z.enum(["percent", "fixed"]),
  value: z.number().positive(),
  max_uses: z.number().int().positive().nullable().optional(),
  expires_at: z.string().datetime().nullable().optional(),
});

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = couponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coupons")
    .insert({
      code: parsed.data.code,
      type: parsed.data.type,
      value: parsed.data.value,
      max_uses: parsed.data.max_uses ?? null,
      expires_at: parsed.data.expires_at ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
