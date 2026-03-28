import Link from "next/link";
import { Plus, Clock, Star, Camera, MapPin, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBusinessesByOwner } from "@/lib/db/businesses";
import { getTodaySchedule } from "@/lib/db/schedules";
import { isOpenNow } from "@/lib/utils/schedule";
import type { Business } from "@/lib/types";
import BusinessSelector from "@/components/dashboard/BusinessSelector";

function ExpiryBadge({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) return null;
  const exp = new Date(expiresAt);
  const now = new Date();
  const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = exp.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });

  if (daysLeft <= 0) {
    return (
      <Link
        href="/pricing"
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
      >
        תוקף פג — חדשו עכשיו
      </Link>
    );
  }
  if (daysLeft <= 7) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">
        פעיל עד {formatted}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-100 text-[#059669]">
      פעיל עד {formatted}
    </span>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ businessId?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const businesses = await getBusinessesByOwner(user.id);
  const params = await searchParams;

  return (
    <div className="space-y-6" dir="rtl">
      {businesses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center shadow-card">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-blue-600" aria-hidden="true" />
          </div>
          <h2 className="font-display font-bold text-xl text-stone-900 mb-2">
            עדיין אין לכם עסק רשום
          </h2>
          <p className="text-stone-500 text-sm mb-6">
            הוסיפו את העסק שלכם כדי להופיע על המפה
          </p>
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            יצירת פרופיל עסק
          </Link>
        </div>
      ) : (
        <DashboardContent
          businesses={businesses}
          selectedId={params.businessId}
        />
      )}
    </div>
  );
}

async function DashboardContent({
  businesses,
  selectedId,
}: {
  businesses: Business[];
  selectedId?: string;
}) {
  const business = businesses.find((b) => b.id === selectedId) ?? businesses[0];
  if (!business) return null;

  const schedule = await getTodaySchedule(business.id);
  const isOpen = isOpenNow(schedule);

  return (
    <>
      {businesses.length > 1 && (
        <BusinessSelector businesses={businesses} selectedId={business.id} />
      )}

      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-display font-bold text-2xl text-stone-900">
            שלום! 👋
          </h1>
          <ExpiryBadge expiresAt={(business as Record<string, unknown>).expires_at as string | null} />
        </div>
        <p className="text-stone-500 text-sm mt-1">
          ברוכים הבאים ללוח הבקרה של{" "}
          <span className="font-medium text-stone-700">{business.name}</span>
        </p>
      </div>

      {/* Today's status card */}
      <div
        className={`rounded-2xl p-6 border ${
          isOpen
            ? "bg-emerald-50 border-emerald-200"
            : "bg-white border-stone-200"
        } shadow-card`}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-lg text-stone-900">
            סטטוס היום
          </h2>
          <span
            className={`text-sm font-medium px-3 py-1 rounded-full ${
              isOpen
                ? "bg-emerald-500 text-white"
                : "bg-stone-200 text-stone-600"
            }`}
          >
            {isOpen ? "פתוח עכשיו ●" : schedule ? "סגור" : "לא פורסם"}
          </span>
        </div>

        {schedule ? (
          <div className="text-stone-600 text-sm space-y-1.5">
            {schedule.address && (
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#059669] flex-shrink-0" aria-hidden="true" />
                {schedule.address}
              </p>
            )}
            {schedule.open_time && schedule.close_time && (
              <p className="flex items-center gap-1.5 tabular-nums">
                <Clock className="h-3.5 w-3.5 text-[#059669] flex-shrink-0" aria-hidden="true" />
                {schedule.open_time.slice(0, 5)} – {schedule.close_time.slice(0, 5)}
              </p>
            )}
            {schedule.note && (
              <p className="flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5 text-[#059669] flex-shrink-0" aria-hidden="true" />
                {schedule.note}
              </p>
            )}
          </div>
        ) : (
          <p className="text-stone-500 text-sm">
            לא פרסמתם לוח זמנים להיום
          </p>
        )}

        <Link
          href="/dashboard/schedule"
          className="inline-flex items-center justify-center h-10 px-5 mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          {schedule ? "עריכת לוח הזמנים" : "פרסמו לוח זמנים"}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Star className="h-5 w-5 text-blue-600" />}
          label="דירוג ממוצע"
          value={
            business.avg_rating > 0
              ? `${business.avg_rating.toFixed(1)} ★`
              : "אין עדיין"
          }
          href={`/businesses/${business.id}#reviews`}
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-emerald-500" />}
          label="ביקורות"
          value={String(business.review_count)}
          href={`/businesses/${business.id}#reviews`}
        />
        <StatCard
          icon={<Camera className="h-5 w-5 text-blue-500" />}
          label="ניהול תמונות"
          value="הוסיפו תמונות"
          href="/dashboard/photos"
        />
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-card">
        <h2 className="font-display font-bold text-base text-stone-900 mb-4">
          קישורים מהירים
        </h2>
        <div className="space-y-2">
          <Link
            href={`/businesses/${business.id}`}
            className="flex items-center gap-2 text-sm text-stone-600 hover:text-blue-600 transition-colors py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
          >
            ← צפייה בדף הציבורי של העסק
          </Link>
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-2 text-sm text-stone-600 hover:text-blue-600 transition-colors py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
          >
            ← עריכת פרטי העסק
          </Link>
        </div>
      </div>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl border border-stone-200 p-5 shadow-card hover:shadow-hover transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
    >
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-stone-500 text-sm">{label}</span></div>
      <p className="font-display font-bold text-xl text-stone-900">{value}</p>
    </Link>
  );
}
