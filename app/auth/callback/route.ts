import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { ensurePublicUser } from "@/lib/user-profile";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");
  const isSignup = searchParams.get("signup") === "1";
  const requestedRole = searchParams.get("role");
  const signupRole: "business_owner" | "customer" =
    isSignup && requestedRole === "business_owner"
      ? "business_owner"
      : "customer";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return completeAuthentication(supabase, origin, requestedNext, isSignup, signupRole);
    }
  }

  return callbackFailure(origin, requestedNext);
}

/** Verify the email token only after a deliberate click; this works across browsers without a PKCE cookie. */
export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  // The email landing page submits on our origin. Reject cross-origin form submissions.
  if (request.headers.get("origin") !== origin) return callbackFailure(origin, null);
  const form = await request.formData().catch(() => null);
  const tokenHash = form?.get("token_hash");
  if (typeof tokenHash !== "string" || !/^[a-zA-Z0-9_-]{32,256}$/.test(tokenHash)) {
    return callbackFailure(origin, null);
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "signup" });
  if (error) return callbackFailure(origin, null);
  return completeAuthentication(supabase, origin, null, true, "customer");
}

/** Both OAuth/PKCE and email confirmation create the profile before recording registration success. */
async function completeAuthentication(
  supabase: Awaited<ReturnType<typeof createClient>>,
  origin: string,
  requestedNext: string | null,
  isSignup: boolean,
  fallbackRole: "business_owner" | "customer",
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return callbackFailure(origin, requestedNext);
  const role = user.user_metadata?.role === "business_owner" ? "business_owner" : fallbackRole;
  try {
    await ensurePublicUser(supabase, user, role);
  } catch {
    return callbackFailure(origin, requestedNext);
  }
  const storedNext = isSignup && typeof user.user_metadata?.registration_next === "string"
    ? user.user_metadata.registration_next : null;
  const next = safeRedirectPath(requestedNext ?? storedNext, role === "business_owner" ? "/dashboard" : "/");
  const destination = new URL(next, origin);
  if (isSignup) destination.searchParams.set("registration", role);
  // 303 turns the confirmation form POST into a normal navigation.
  const response = NextResponse.redirect(destination, 303);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

function callbackFailure(origin: string, next: string | null) {
  const destination = new URL("/auth/login", origin);
  destination.searchParams.set("error", "auth_callback_error");
  if (next) destination.searchParams.set("redirectTo", safeRedirectPath(next, "/"));
  const response = NextResponse.redirect(destination, 303);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
