import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-session";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update_profile"),
    name: z.string().max(120),
    role: z.enum(["customer", "business_owner"]),
  }),
  z.object({ action: z.literal("ban") }),
  z.object({ action: z.literal("unban") }),
]);

/** Update safe profile fields or suspend/restore the user's Supabase login. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const admin = adminClient();
  if (parsed.data.action === "update_profile") {
    const { data, error } = await admin
      .from("users")
      .update({ name: parsed.data.name, role: parsed.data.role })
      .eq("id", id)
      .select("id, email, name, role, created_at")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ user: data });
  }

  const banDuration = parsed.data.action === "ban" ? "876000h" : "none";
  const { data, error } = await admin.auth.admin.updateUserById(id, {
    ban_duration: banDuration,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ banned_until: data.user.banned_until ?? null });
}

/** Permanently delete auth, profile, and cascading owned site data. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { error } = await adminClient().auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
