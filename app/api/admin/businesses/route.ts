import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === process.env.ADMIN_SECRET;
}

export const runtime = "nodejs";

// GET /api/admin/businesses — list all businesses (active + pending)
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
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
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { owner_id, name, description, category, kashrut, phone, whatsapp,
          website, instagram, business_number, address, lat, lng,
          duration_months } = body;

  if (!name || !owner_id) {
    return NextResponse.json({ error: "name and owner_id are required" }, { status: 400 });
  }

  const months = parseInt(duration_months) || 1;
  const expires = new Date();
  expires.setMonth(expires.getMonth() + months);

  const admin = adminClient();
  const { data, error } = await admin
    .from("businesses")
    .insert({
      owner_id,
      name,
      description: description || null,
      category: category || "food",
      kashrut: kashrut || "none",
      phone: phone || null,
      whatsapp: whatsapp || null,
      website: website || null,
      instagram: instagram || null,
      business_number: business_number || null,
      address: address || null,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      is_active: true,
      expires_at: expires.toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ business: data });
}
