# Po Finder — Remaining Tasks Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix auth infrastructure, add missing features (error pages, forgot password, storage bucket), fix functional gaps (filtering, search, sidebar), and polish the app (SEO, image optimization, loading states, env validation, mobile menu).

**Architecture:** Sequential changes in dependency order. Auth middleware first (other server components depend on it), then error/password pages, then functional fixes, then polish. All changes are within the existing Next.js 16 + Supabase + Tailwind + shadcn/ui stack.

**Tech Stack:** Next.js 16, Supabase SSR, TypeScript, Tailwind CSS 4, shadcn/ui, Google Maps API, lucide-react

---

## Task 1: Supabase Auth Middleware

**Files:**
- Create: `middleware.ts` (project root)
- Modify: `lib/supabase/server.ts` (no changes needed — already compatible)

**Step 1: Create middleware.ts**

```typescript
// middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the auth token
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**Step 2: Verify the dev server starts without errors**

Run: `npm run dev` — check console for errors, visit http://localhost:3000

**Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add Supabase auth middleware for session refresh"
```

---

## Task 2: Auth Callback — Create Users Row

**Files:**
- Modify: `app/auth/callback/route.ts`

**Step 1: Update the callback route to create user row after session exchange**

Replace the entire file content:

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Ensure a users row exists (for Google OAuth and email confirmation)
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
          await supabase.from("users").insert({
            id: user.id,
            email: user.email ?? "",
            role: meta.role ?? "customer",
            name: meta.name ?? meta.full_name ?? "",
          });
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`);
}
```

**Step 2: Commit**

```bash
git add app/auth/callback/route.ts
git commit -m "fix: create users row in auth callback for OAuth and email confirmation"
```

---

## Task 3: Custom Error Pages

**Files:**
- Create: `app/not-found.tsx`
- Create: `app/error.tsx`

**Step 1: Create not-found.tsx**

```tsx
import Link from "next/link";
import { MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4" dir="rtl">
      <div className="text-center max-w-sm">
        <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
          <MapPin className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="font-display font-extrabold text-6xl text-stone-900 mb-2">404</h1>
        <p className="text-stone-600 text-lg mb-1">העמוד לא נמצא</p>
        <p className="text-stone-400 text-sm mb-8">
          ייתכן שהקישור שגוי או שהעמוד הוסר.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  );
}
```

**Step 2: Create error.tsx**

```tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4" dir="rtl">
      <div className="text-center max-w-sm">
        <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">!</span>
        </div>
        <h1 className="font-display font-bold text-2xl text-stone-900 mb-2">
          משהו השתבש
        </h1>
        <p className="text-stone-500 text-sm mb-8">
          אירעה שגיאה בלתי צפויה. נסו לרענן את העמוד.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          נסו שוב
        </button>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add app/not-found.tsx app/error.tsx
git commit -m "feat: add custom 404 and error pages"
```

---

## Task 4: Forgot Password Flow

**Files:**
- Create: `app/auth/forgot-password/page.tsx`
- Create: `app/auth/reset-password/page.tsx`
- Modify: `app/auth/login/page.tsx` (add forgot password link, around line 137)

**Step 1: Create forgot-password page**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setError("שגיאה בשליחת הקישור. נסו שוב.");
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <MapPin className="h-7 w-7 fill-blue-600 text-blue-600" />
            <span className="font-display font-extrabold text-2xl text-blue-600">פה</span>
          </Link>
        </div>

        {sent ? (
          <div className="text-center py-8">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📬</span>
            </div>
            <h1 className="font-display font-bold text-2xl text-stone-900 mb-2">
              בדקו את המייל
            </h1>
            <p className="text-stone-500 text-sm">
              שלחנו קישור לאיפוס הסיסמה ל-<strong>{email}</strong>.
            </p>
            <Link href="/auth/login" className="text-blue-600 text-sm font-medium hover:underline mt-4 inline-block">
              חזרה לכניסה
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-display font-bold text-3xl text-stone-900 mb-1">
              שכחתם את הסיסמה?
            </h1>
            <p className="text-stone-500 text-sm mb-8">
              הזינו את כתובת המייל ונשלח לכם קישור לאיפוס.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-stone-700 font-medium text-sm mb-1.5 block">
                  כתובת מייל
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-xl border-stone-200 focus-visible:ring-blue-600"
                  dir="ltr"
                />
              </div>

              {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {loading ? "...שולח" : "שליחת קישור איפוס"}
              </Button>
            </form>

            <p className="text-center mt-6 text-sm text-stone-500">
              <Link href="/auth/login" className="text-blue-600 font-medium hover:underline">
                חזרה לכניסה
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Create reset-password page**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("הסיסמאות אינן תואמות.");
      return;
    }
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError("שגיאה בעדכון הסיסמה. נסו שוב.");
    } else {
      router.push("/auth/login?message=password_updated");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <MapPin className="h-7 w-7 fill-blue-600 text-blue-600" />
            <span className="font-display font-extrabold text-2xl text-blue-600">פה</span>
          </Link>
        </div>

        <h1 className="font-display font-bold text-3xl text-stone-900 mb-1">
          סיסמה חדשה
        </h1>
        <p className="text-stone-500 text-sm mb-8">
          הזינו סיסמה חדשה לחשבון שלכם.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password" className="text-stone-700 font-medium text-sm mb-1.5 block">
              סיסמה חדשה (לפחות 6 תווים)
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-11 rounded-xl border-stone-200 focus-visible:ring-blue-600"
              dir="ltr"
            />
          </div>

          <div>
            <Label htmlFor="confirm" className="text-stone-700 font-medium text-sm mb-1.5 block">
              אימות סיסמה
            </Label>
            <Input
              id="confirm"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="h-11 rounded-xl border-stone-200 focus-visible:ring-blue-600"
              dir="ltr"
            />
          </div>

          {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {loading ? "...מעדכן" : "עדכון סיסמה"}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

**Step 3: Add forgot password link to login page**

In `app/auth/login/page.tsx`, after the password `</div>` (line 138) and before `{error && (` (line 141), add:

```tsx
            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                שכחתם את הסיסמה?
              </Link>
            </div>
```

**Step 4: Commit**

```bash
git add app/auth/forgot-password/page.tsx app/auth/reset-password/page.tsx app/auth/login/page.tsx
git commit -m "feat: add forgot password and reset password flow"
```

---

## Task 5: Storage Bucket Migration

**Files:**
- Create: `supabase/migrations/002_storage_bucket.sql`

**Step 1: Create migration file**

```sql
-- Create photos storage bucket
insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Allow anyone to read photos
create policy "Public read access" on storage.objects
  for select using (bucket_id = 'photos');

-- Allow authenticated users to upload photos for their own businesses
create policy "Authenticated users can upload photos" on storage.objects
  for insert with check (
    bucket_id = 'photos'
    and auth.role() = 'authenticated'
  );

-- Allow authenticated users to delete their own photos
create policy "Users can delete own photos" on storage.objects
  for delete using (
    bucket_id = 'photos'
    and auth.role() = 'authenticated'
  );
```

**Step 2: Commit**

```bash
git add supabase/migrations/002_storage_bucket.sql
git commit -m "feat: add storage bucket migration for photos"
```

---

## Task 6: Verify Map/List Filtering

**Files:**
- Review: `components/business/BusinessListPanel.tsx:55-61` (filtering logic)
- Review: `components/map/BusinessMap.tsx:108-118` (filtering logic)

**Step 1: Review filtering logic**

Both `BusinessListPanel` (line 55-61) and `BusinessMap` (line 108-118) already apply all 3 filters:
- `kashrut !== "all"` check: YES
- `minRating > 0` check: YES
- `openNow` with `isOpenNow()`: YES

The filtering logic is correctly duplicated in both components. No changes needed.

**Step 2: Commit** — nothing to commit, filtering is already correct.

---

## Task 7: Search on Non-Homepage Pages

**Files:**
- Modify: `components/layout/Navbar.tsx:72-86` (non-home search bar)

**Step 1: Replace the dummy search button with a navigating search**

In `components/layout/Navbar.tsx`, replace the `else` branch (lines 72-86 — the search button when `onLocationSelect` is not provided) with a link that navigates to home:

Replace the `<button onClick={() => setMobileSearchOpen(true)} ... >` block (the desktop search bar fallback) with:

```tsx
            <Link
              href="/"
              className="flex items-center w-full h-12 rounded-full border border-[#DDDDDD] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.18)] transition-all duration-200 px-2"
              aria-label="חיפוש עיר או שכונה — חזרה לדף הבית"
            >
              <div className="flex-1 flex items-center justify-between px-4 text-sm">
                <span className="font-semibold text-[#222222]">בכל מקום</span>
                <span className="w-[1px] h-6 bg-[#DDDDDD] mx-3"></span>
                <span className="text-[#717171] truncate">כל קטגוריה</span>
              </div>
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#059669] text-white flex items-center justify-center mr-2">
                <Search className="h-4 w-4" aria-hidden="true" />
              </div>
            </Link>
```

Also update the mobile search overlay (lines 158-188) — the `else` branch inside `mobileSearchOpen` — to navigate home instead of showing a dead input. Replace the fallback `<div className="relative">` with:

```tsx
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="חפשו עיר או שכונה..."
                  autoFocus
                  className="w-full h-12 rounded-full border border-slate-200 pe-10 ps-4 text-base focus:outline-none focus:ring-2 focus:ring-[#059669]"
                  aria-label="חיפוש"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      window.location.href = "/";
                    }
                  }}
                />
              </div>
```

**Step 2: Commit**

```bash
git add components/layout/Navbar.tsx
git commit -m "fix: navbar search on non-homepage navigates to map page"
```

---

## Task 8: Active Sidebar Link in Dashboard

**Files:**
- Modify: `app/dashboard/layout.tsx` — convert to client component pattern for pathname

**Step 1: Create a client sidebar component**

Since the layout is a server component (for auth check), extract the sidebar nav into a client component. Add a `DashboardSidebar` at the bottom of the file or create it inline.

Approach: convert `SidebarLink` to use `usePathname()`. The simplest approach is to make the sidebar nav a client component embedded in the server layout.

In `app/dashboard/layout.tsx`, replace the current `SidebarLink` function (lines 67-76) and update the nav section. Add a new file:

Create: `components/layout/DashboardSidebar.tsx`

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "סקירה כללית", exact: true },
  { href: "/dashboard/profile", label: "עריכת פרופיל" },
  { href: "/dashboard/schedule", label: "לוח זמנים להיום" },
  { href: "/dashboard/photos", label: "תמונות" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-full md:w-56 flex-shrink-0" aria-label="ניווט לוח הבקרה">
      {/* Desktop sidebar */}
      <nav className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-card">
        {NAV_ITEMS.map(({ href, label, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-inset border-r-2 ${
                active
                  ? "bg-blue-50 text-blue-700 border-r-blue-600"
                  : "text-slate-600 hover:bg-blue-50 hover:text-blue-700 border-r-transparent hover:border-r-blue-600"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile tab bar */}
      <nav className="flex md:hidden overflow-x-auto scrollbar-hide bg-white rounded-2xl border border-slate-200 shadow-card">
        {NAV_ITEMS.map(({ href, label, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 py-3 px-2 text-center text-xs font-medium whitespace-nowrap border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                active
                  ? "text-blue-600 border-b-blue-600"
                  : "text-slate-600 hover:text-blue-600 border-b-transparent hover:border-b-blue-600"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

Then modify `app/dashboard/layout.tsx` to import and use it:
- Remove the `NAV_ITEMS` constant, the `SidebarLink` function, and the inline `<aside>` block
- Import `DashboardSidebar` and replace `<aside>...</aside>` with `<DashboardSidebar />`

**Step 2: Commit**

```bash
git add components/layout/DashboardSidebar.tsx app/dashboard/layout.tsx
git commit -m "feat: add active link highlighting in dashboard sidebar"
```

---

## Task 9: SEO Metadata

**Files:**
- Modify: `app/businesses/[id]/page.tsx` — add `generateMetadata()`
- Modify: `app/auth/login/page.tsx` — add metadata
- Modify: `app/auth/register/page.tsx` — add metadata
- Modify: `app/auth/forgot-password/page.tsx` — add metadata (during creation)
- Modify: `app/auth/reset-password/page.tsx` — add metadata (during creation)
- Modify: `app/dashboard/page.tsx` — add metadata
- Modify: `app/dashboard/profile/page.tsx` — add metadata
- Modify: `app/dashboard/schedule/page.tsx` — add metadata
- Modify: `app/dashboard/photos/page.tsx` — add metadata

**Step 1: Add generateMetadata to business detail page**

At the top of `app/businesses/[id]/page.tsx`, after the imports, add:

```typescript
import type { Metadata } from "next";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const business = await getBusinessById(id);
    return {
      title: `${business.name} — פה`,
      description: business.description ?? `${business.name} — עסק קטן על המפה`,
    };
  } catch {
    return { title: "עסק לא נמצא — פה" };
  }
}
```

**Step 2: Add metadata to auth pages (login, register are client components — use layout or separate metadata file)**

Since login and register are client components, metadata must be exported separately. The simplest approach: the `export const dynamic` already exists, so we can add a metadata file alongside each.

Create `app/auth/login/layout.tsx`:
```tsx
export const metadata = { title: "כניסה — פה" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
```

Create `app/auth/register/layout.tsx`:
```tsx
export const metadata = { title: "הרשמה — פה" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
```

Create `app/auth/forgot-password/layout.tsx`:
```tsx
export const metadata = { title: "איפוס סיסמה — פה" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
```

Create `app/auth/reset-password/layout.tsx`:
```tsx
export const metadata = { title: "סיסמה חדשה — פה" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
```

**Step 3: Add metadata to dashboard pages**

In `app/dashboard/layout.tsx`, the metadata is inherited. Add:
```typescript
export const metadata = { title: "לוח בקרה — פה" };
```

For sub-pages (profile, schedule, photos), they're client components. Create layout files:

Create `app/dashboard/profile/layout.tsx`:
```tsx
export const metadata = { title: "עריכת פרופיל — פה" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
```

Create `app/dashboard/schedule/layout.tsx`:
```tsx
export const metadata = { title: "לוח זמנים — פה" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
```

Create `app/dashboard/photos/layout.tsx`:
```tsx
export const metadata = { title: "תמונות — פה" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
```

**Step 4: Commit**

```bash
git add app/businesses/[id]/page.tsx app/auth/*/layout.tsx app/dashboard/layout.tsx app/dashboard/*/layout.tsx
git commit -m "feat: add SEO metadata to all pages"
```

---

## Task 10: Image Optimization with next/image

**Files:**
- Modify: `next.config.ts` — add `images.remotePatterns`
- Modify: `components/business/BusinessCard.tsx:82-87` — replace `<img>` with `<Image>`
- Modify: `components/business/PhotoGrid.tsx:38-43, 50-54, 96-99` — replace `<img>` with `<Image>`
- Modify: `components/business/BusinessListPanel.tsx:98` — replace `<img>` with `<Image>`
- Modify: `app/dashboard/photos/page.tsx:156-159` — replace `<img>` with `<Image>`

**Step 1: Update next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ymqlqdhelsocibhnanjy.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
```

**Step 2: Replace img tags in each file**

In each file, add `import Image from "next/image";` and replace `<img>` tags with `<Image>`:

For `BusinessCard.tsx` (line 82-87): Replace the `<img>` with:
```tsx
<Image
  src={primaryPhoto.url}
  alt={`תמונה של ${business.name}`}
  fill
  className="object-cover transition-transform duration-300 group-hover:scale-105"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
/>
```
Remove the `eslint-disable-next-line` comment above it. Add `relative` to the parent div's className if not already there (the parent `div` with `aspect-[4/3]` already has `relative` via the `overflow-hidden` parent context — but to be safe, ensure parent has `relative`).

For `BusinessListPanel.tsx` (line 98): Replace `<img>` with:
```tsx
<Image src={selectedBusiness.photos[0].url} fill className="object-cover" alt={selectedBusiness.name} sizes="(max-width: 768px) 100vw, 600px" />
```

For `PhotoGrid.tsx`: Replace each `<img>` (primary: line 39, secondary: line 51, gallery: line 97) with `<Image>` using `fill` for grid images and explicit dimensions for gallery. Remove `eslint-disable-next-line` comments.

For `app/dashboard/photos/page.tsx` (line 156-159): Replace `<img>` with:
```tsx
<Image src={photo.url} alt="תמונת עסק" fill className="object-cover" sizes="(max-width: 640px) 50vw, 33vw" />
```

**Step 3: Commit**

```bash
git add next.config.ts components/business/BusinessCard.tsx components/business/BusinessListPanel.tsx components/business/PhotoGrid.tsx app/dashboard/photos/page.tsx
git commit -m "perf: replace img tags with next/image for optimization"
```

---

## Task 11: Fix Silent Null Returns

**Files:**
- Modify: `app/dashboard/page.tsx:12` — the `if (!user) return null;` line

**Step 1: Fix DashboardPage**

The `DashboardPage` returns `null` when there's no user (line 12). Since the dashboard layout already redirects unauthenticated users, this `null` return is a safety fallback. It's fine as-is because the layout handles the redirect. No change needed.

However, the check at line 12 should technically never be reached. Leave it as a safety measure.

**Step 2: No commit needed** — the layout already redirects, and the null return is a safe fallback.

---

## Task 12: Environment Variable Validation

**Files:**
- Create: `lib/env.ts`
- Modify: `app/layout.tsx` — import env validation

**Step 1: Create env.ts**

```typescript
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: requireEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
} as const;
```

**Step 2: Import in root layout to trigger validation at startup**

In `app/layout.tsx`, add at the top after other imports:
```typescript
import "@/lib/env";
```

**Step 3: Commit**

```bash
git add lib/env.ts app/layout.tsx
git commit -m "feat: add environment variable validation at startup"
```

---

## Task 13: Expand Mobile Menu

**Files:**
- Modify: `components/layout/Navbar.tsx:191-202` (mobile menu section)

**Step 1: Expand the mobile menu content**

Replace the mobile menu section (lines 191-202) with:

```tsx
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[72px] z-40 bg-white shadow-popup border-t border-slate-100 py-3 px-4 slide-in-right" dir="rtl">
          <Link
            href="/"
            className="flex items-center gap-2 py-3 text-slate-700 font-medium hover:text-[#059669] transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <MapPin className="h-5 w-5" />
            דף הבית
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 py-3 text-slate-700 font-medium hover:text-[#059669] transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Plus className="h-5 w-5" />
            הוסיפו עסק
          </Link>
          <hr className="my-2 border-slate-100" />
          {user ? (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleSignOut();
              }}
              className="flex items-center gap-2 py-3 text-slate-700 font-medium hover:text-red-600 transition-colors w-full"
            >
              יציאה
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-2 py-3 text-blue-600 font-medium hover:text-blue-700 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              כניסה / הרשמה
            </Link>
          )}
        </div>
      )}
```

Also add `Home` icon import at the top if needed — actually we can use `MapPin` which is already imported. The `Plus` icon is also already imported.

**Step 2: Commit**

```bash
git add components/layout/Navbar.tsx
git commit -m "feat: expand mobile menu with home, login/logout links"
```

---

## Summary

| Task | Description | Files changed |
|------|-------------|---------------|
| 1 | Supabase auth middleware | +middleware.ts |
| 2 | Auth callback user row | ~app/auth/callback/route.ts |
| 3 | Custom error pages | +app/not-found.tsx, +app/error.tsx |
| 4 | Forgot password flow | +2 pages, ~login page |
| 5 | Storage bucket migration | +supabase/migrations/002 |
| 6 | Verify filtering | No changes needed |
| 7 | Search on non-homepage | ~Navbar.tsx |
| 8 | Active sidebar link | +DashboardSidebar.tsx, ~dashboard/layout.tsx |
| 9 | SEO metadata | ~businesses/[id], +8 layout files |
| 10 | Image optimization | ~next.config.ts, ~4 component files |
| 11 | Fix null returns | No changes needed |
| 12 | Env validation | +lib/env.ts, ~layout.tsx |
| 13 | Mobile menu | ~Navbar.tsx |
