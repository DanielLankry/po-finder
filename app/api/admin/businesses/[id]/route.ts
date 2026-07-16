import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-session";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function isAdmin(req: NextRequest) {
  return isAdminRequest(req);
}

const patchSchema = z.object({
  name: z.string().min(1).max(160).optional(),
  description: z.string().max(4000).nullable().optional(),
  category: z.enum(["coffee", "food", "sweets", "meat", "vegan", "celiac", "flowers", "jewelry", "vintage"]).optional(),
  kashrut: z.enum(["kosher", "kosher_mehadrin", "none"]).optional(),
  phone: z.string().max(40).nullable().optional(),
  whatsapp: z.string().max(40).nullable().optional(),
  website: z.string().max(500).nullable().optional(),
  instagram: z.string().max(160).nullable().optional(),
  business_number: z.string().max(80).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  is_active: z.boolean().optional(),
  is_verified: z.boolean().optional(),
  expires_at: z.string().datetime().nullable().optional(),
}).strict();

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = adminClient();
  const { error } = await admin.from("businesses").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
    return NextResponse.json({ error: parsed.success ? "No changes supplied" : parsed.error.flatten() }, { status: 400 });
  }

  const admin = adminClient();
  const { data, error } = await admin
    .from("businesses")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ business: data });
}
