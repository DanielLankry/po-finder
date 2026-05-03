import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("admin_session")?.value;
  if (session !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = adminClient();
  const { data: attempts, error } = await admin
    .from("payment_attempts")
    .select("id, user_id, business_id, plan_days, amount_agorot, status, hyp_transaction_id, hyp_card_mask, hyp_response_code, created_at, completed_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Hydrate user email + business name in parallel.
  const userIds = Array.from(new Set(attempts?.map((a) => a.user_id) ?? []));
  const businessIds = Array.from(
    new Set(attempts?.map((a) => a.business_id).filter((x): x is string => !!x) ?? [])
  );

  const [usersRes, businessesRes] = await Promise.all([
    userIds.length
      ? admin.from("users").select("id, email").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; email: string }[] }),
    businessIds.length
      ? admin.from("businesses").select("id, name").in("id", businessIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const userMap = new Map((usersRes.data ?? []).map((u) => [u.id, u.email]));
  const bizMap = new Map((businessesRes.data ?? []).map((b) => [b.id, b.name]));

  const items = (attempts ?? []).map((a) => ({
    ...a,
    user_email: userMap.get(a.user_id) ?? null,
    business_name: a.business_id ? bizMap.get(a.business_id) ?? null : null,
  }));

  return NextResponse.json({ items });
}
