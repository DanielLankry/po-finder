import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin-session";
import { hasHypPaymentReturnParams } from "@/lib/payment-state";

const PUBLIC_PAGE_ROUTES = new Set([
  "/",
  "/about",
  "/accessibility",
  "/contact",
  "/pricing",
  "/privacy",
  "/refund",
  "/terms",
  "/vendors",
]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    !pathname.startsWith("/api/payments/") &&
    hasHypPaymentReturnParams(request.nextUrl.searchParams)
  ) {
    // HYP terminal-level success URLs can land on /pricing; settle them before
    // a static page can render and leave the payment_attempt pending.
    const settleUrl = new URL("/api/payments/return", request.url);
    request.nextUrl.searchParams.forEach((value, key) => {
      settleUrl.searchParams.append(key, value);
    });
    return NextResponse.redirect(settleUrl);
  }

  // Admin routes: check admin_session cookie.
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!(await isAdminRequest(request))) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (
    request.method === "GET" &&
    (PUBLIC_PAGE_ROUTES.has(pathname) ||
      pathname === "/api/businesses" ||
      pathname === "/api/reviews" ||
      pathname === "/robots.txt" ||
      pathname === "/sitemap.xml")
  ) {
    return NextResponse.next();
  }

  // Supabase session refresh for all other routes.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
