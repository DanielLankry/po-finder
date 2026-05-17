import { NextResponse } from "next/server";
import { getDashboardAccessForUser } from "@/lib/dashboard-access";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ authenticated: false, dashboardAccess: false }, { status: 401 });
  }

  try {
    const { hasAccess } = await getDashboardAccessForUser(user.id);
    return NextResponse.json({
      authenticated: true,
      dashboardAccess: hasAccess,
      email: user.email ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
