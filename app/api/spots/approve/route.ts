import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ADMIN_EMAIL = "lankrydaniel7@gmail.com";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { spot_id, action, admin_note } = await req.json();
  if (!spot_id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const update =
    action === "approve"
      ? { status: "approved", approved_at: new Date().toISOString(), admin_note: admin_note ?? null }
      : { status: "rejected", admin_note: admin_note ?? null };

  const { error } = await supabase.from("spots").update(update).eq("id", spot_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
