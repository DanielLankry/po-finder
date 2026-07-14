import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-session";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const schema = z.object({
  serviceStatus: z.enum(["pending", "contacted", "in_progress", "completed", "cancelled"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  const { data, error } = await adminClient()
    .from("payment_attempts")
    .update({ service_status: parsed.data.serviceStatus })
    .eq("id", id)
    .eq("product_code", "assisted_launch")
    .eq("status", "succeeded")
    .select("id, service_status")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "assisted launch payment not found" }, { status: 404 });
  return NextResponse.json({ ok: true, serviceStatus: data.service_status });
}
