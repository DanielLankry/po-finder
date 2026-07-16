import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-session";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** List public profiles together with auth status and owned-business counts. */
export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = adminClient();
  const [{ data: profiles, error: profileError }, { data: authData, error: authError }, { data: businesses, error: businessError }] = await Promise.all([
    admin.from("users").select("id, email, name, role, created_at").order("created_at", { ascending: false }).limit(1000),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("businesses").select("owner_id"),
  ]);

  const error = profileError ?? authError ?? businessError;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const authById = new Map((authData?.users ?? []).map((user) => [user.id, user]));
  const businessCounts = new Map<string, number>();
  for (const business of businesses ?? []) {
    businessCounts.set(business.owner_id, (businessCounts.get(business.owner_id) ?? 0) + 1);
  }

  const users = (profiles ?? []).map((profile) => {
    const authUser = authById.get(profile.id);
    return {
      ...profile,
      business_count: businessCounts.get(profile.id) ?? 0,
      last_sign_in_at: authUser?.last_sign_in_at ?? null,
      banned_until: authUser?.banned_until ?? null,
    };
  });

  return NextResponse.json({ users });
}
