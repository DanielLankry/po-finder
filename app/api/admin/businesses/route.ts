import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-session";
import { addCalendarMonths } from "@/lib/plans";
import { adminClient } from "@/lib/supabase/admin";

async function isAdmin(req: NextRequest) {
  return isAdminRequest(req);
}

export const runtime = "nodejs";

/** Normalizes optional admin text fields to null while enforcing DB-safe lengths. */
const nullableText = (max: number) =>
  z.preprocess(
    (value) => value === "" || value == null ? null : value,
    z.string().trim().max(max).nullable()
  );

/** Coerces optional coordinates and rejects values outside geographic bounds. */
const nullableCoordinate = (min: number, max: number) =>
  z.preprocess(
    (value) => value === "" || value == null ? null : value,
    z.coerce.number().min(min).max(max).nullable()
  );

const createBusinessSchema = z.object({
  owner_id: z.string().uuid(),
  name: z.string().trim().min(1).max(160),
  description: nullableText(4000),
  category: z.enum(["coffee", "food", "sweets", "meat", "vegan", "celiac", "flowers", "jewelry", "vintage"]),
  kashrut: z.enum(["kosher", "kosher_mehadrin", "none"]),
  phone: nullableText(40),
  whatsapp: nullableText(40),
  website: nullableText(500),
  instagram: nullableText(160),
  business_number: nullableText(80),
  address: nullableText(500),
  lat: nullableCoordinate(-90, 90),
  lng: nullableCoordinate(-180, 180),
  duration_months: z.coerce.number().int().min(1).max(120),
}).strict();

// GET /api/admin/businesses — list all businesses (active + pending)
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = adminClient();
  const { data, error } = await admin
    .from("businesses")
    .select("*")
    .order("is_active", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ businesses: data ?? [] });
}

// POST /api/admin/businesses — manually add a business (admin use only)
export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createBusinessSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const {
    owner_id, name, description, category, kashrut, phone, whatsapp,
    website, instagram, business_number, address, lat, lng, duration_months,
  } = parsed.data;
  const expires = addCalendarMonths(new Date(), duration_months);

  const admin = adminClient();
  const { data, error } = await admin
    .from("businesses")
    .insert({
      owner_id,
      name,
      description,
      category,
      kashrut,
      phone,
      whatsapp,
      website,
      instagram,
      business_number,
      address,
      lat,
      lng,
      is_verified: true,
      is_active: true,
      expires_at: expires.toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ business: data }, { status: 201 });
}
