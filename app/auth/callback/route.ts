import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { safeRedirectPath } from "@/lib/safe-redirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"), "/");
  const isSignup = searchParams.get("signup") === "1";
  const requestedRole = searchParams.get("role");
  const signupRole =
    isSignup && requestedRole === "business_owner"
      ? "business_owner"
      : "customer";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (!existingUser) {
          const meta = user.user_metadata ?? {};
          const role =
            meta.role === "business_owner" ? "business_owner" : signupRole;
          await supabase.from("users").insert({
            id: user.id,
            email: user.email ?? "",
            role,
            name: String(meta.name ?? meta.full_name ?? "").slice(0, 120),
          });
        }
      }

      const destination = new URL(next, origin);
      if (isSignup) destination.searchParams.set("registration", signupRole);
      const response = NextResponse.redirect(destination);
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`);
}
