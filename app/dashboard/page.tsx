import Link from "next/link";
import { Plus, Clock, Star, Camera, MapPin, MessageCircle, Eye, Phone, Hand, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBusinessesByOwner } from "@/lib/db/businesses";
import { getTodaySchedule } from "@/lib/db/schedules";
import { isOpenNow } from "@/lib/utils/schedule";
import type { Business } from "@/lib/types";
import BusinessSelector from "@/components/dashboard/BusinessSelector";
import { OwnerLifecycleBanner } from "@/components/dashboard/OwnerLifecycleStatus";
import ShareButtons from "@/components/business/ShareButtons";

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
        <div className="brand-panel p-8 text-center">
          <div className="h-16 w-16 rotate-3 rounded-2xl border-2 border-[#17402D] bg-[#FFF3B0] shadow-[3px_3px_0_0_#17402D] flex items-center justify-center mx-auto mb-5">
            <Plus className="h-8 w-8 text-[#2D6A4F]" aria-hidden="true" />
          </div>
          <h2 className="font-display font-bold text-xl text-stone-900 mb-2">
            עדיין אין לכם עסק רשום
          </h2>
          <p className="text-stone-500 text-sm mb-6">
            הוסיפו את העסק שלכם כדי להופיע על המפה
          </p>
          <Link
            href="/dashboard/profile"
            className="brand-button inline-flex items-center justify-center h-11 px-6 rounded-xl font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4552D] focus-visible:ring-offset-2"
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
  const nowIso = new Date().toISOString();

  // Analytics: last 30 days
  const supabase = await createClient();
  // eslint-disable-next-line react-hooks/purity
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: analyticsData } = await supabase
    .from("business_analytics_events")
    .select("event_type")
    .eq("business_id", business.id)
    .gte("created_at", thirtyDaysAgo);

  const viewCount = analyticsData?.filter((e: { event_type: string }) => e.event_type === "view").length ?? 0;
  const callCount = analyticsData?.filter((e: { event_type: string }) => e.event_type === "call_click").length ?? 0;

  return (
    <>
      {businesses.length > 1 && (
        <BusinessSelector businesses={businesses} selectedId={business.id} />
      )}

      <div className="brand-panel-soft relative overflow-hidden p-5 sm:p-6">
        <div className="absolute -left-5 -top-5 h-16 w-16 rotate-12 rounded-2xl border-2 border-[#8A3618] bg-[#F6E3D9]" aria-hidden="true" />
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-display text-4xl text-[#17402D]">
            שלום! <Hand className="inline-block h-7 w-7 text-[#C4552D]" aria-hidden="true" />
          </h1>
        </div>
        <p className="relative text-stone-600 text-sm mt-1">
          ברוכים הבאים ללוח הבקרה של{" "}
          <span className="font-medium text-stone-700">{business.name}</span>
        </p>
      </div>

      <OwnerLifecycleBanner business={business} nowIso={nowIso} />

      {/* Today's status card */}
      <div
        className={`rounded-[18px] p-6 border-2 shadow-[4px_4px_0_0_#17402D] ${
          isOpen
            ? "bg-emerald-50 border-[#17402D]"
            : "bg-white border-[#17402D]"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-lg text-stone-900">
            סטטוס היום
          </h2>
          <span
            className={`text-sm font-bold px-3 py-1 rounded-full border-2 ${
              isOpen
                ? "bg-emerald-500 text-white border-[#17402D]"
                : "bg-stone-200 text-stone-600 border-stone-500"
            }`}
          >
            {isOpen ? "פתוח עכשיו ●" : schedule ? "סגור" : "לא פורסם"}
          </span>
        </div>

        {schedule ? (
          <div className="text-stone-600 text-sm space-y-1.5">
            {schedule.address && (
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#2D6A4F] flex-shrink-0" aria-hidden="true" />
                {schedule.address}
              </p>
            )}
            {schedule.open_time && schedule.close_time && (
              <p className="flex items-center gap-1.5 tabular-nums">
                <Clock className="h-3.5 w-3.5 text-[#2D6A4F] flex-shrink-0" aria-hidden="true" />
                {schedule.open_time.slice(0, 5)} – {schedule.close_time.slice(0, 5)}
              </p>
            )}
            {schedule.note && (
              <p className="flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5 text-[#2D6A4F] flex-shrink-0" aria-hidden="true" />
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
          className="brand-button inline-flex items-center justify-center h-10 px-5 mt-4 rounded-xl font-bold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4552D] focus-visible:ring-offset-2"
        >
          {schedule ? "עריכת לוח הזמנים" : "פרסמו לוח זמנים"}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Star className="h-5 w-5 text-[#2D6A4F]" />}
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
          icon={<Camera className="h-5 w-5 text-[#4A8B66]" />}
          label="ניהול תמונות"
          value="הוסיפו תמונות"
          href="/dashboard/photos"
        />
      </div>

      {/* Analytics widget — last 30 days */}
      <div className="brand-panel p-6">
        <h2 className="font-display font-bold text-base text-stone-900 mb-1">
          אנליטיקה — 30 הימים האחרונים
        </h2>
        <p className="text-stone-400 text-xs mb-4">
          נתוני ביקורים ופעולות על הדף הציבורי
        </p>
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-[#17402D]/20 bg-[#EFF5F0] px-3 py-2 text-xs leading-relaxed text-stone-600">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#2D6A4F]" aria-hidden="true" />
          <span>המספרים מוצגים כסיכום בלבד. אנחנו לא מציגים זהות, שמות או פרטי קשר של מבקרים.</span>
        </div>
        <div className="brand-rule mb-5" aria-hidden="true" />
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div className="rounded-xl bg-[#EFF5F0] p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Eye className="h-4 w-4 text-[#4A8B66]" aria-hidden="true" />
            </div>
            <p className="font-display font-bold text-2xl text-stone-900">{viewCount}</p>
            <p className="text-stone-500 text-xs mt-0.5">צפיות</p>
          </div>
          <div className="rounded-xl bg-[#FFF3B0]/60 p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Phone className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            </div>
            <p className="font-display font-bold text-2xl text-stone-900">{callCount}</p>
            <p className="text-stone-500 text-xs mt-0.5">לחיצות שיחה</p>
          </div>
        </div>
      </div>

      {/* Share section */}
      <div className="brand-panel-soft p-6" dir="rtl">
        <h2 className="font-display font-bold text-base text-stone-900 mb-1">
          שתף את הדף שלי
        </h2>
        <p className="text-xs text-stone-500 mb-4">שלח ללקוחות קישור לדף העסק שלך</p>
        <ShareButtons businessId={business.id} businessName={business.name} />
      </div>

      {/* Quick links */}
      <div className="brand-panel-soft p-6">
        <h2 className="font-display font-bold text-base text-stone-900 mb-4">
          קישורים מהירים
        </h2>
        <div className="space-y-2">
          <Link
            href={`/businesses/${business.id}`}
            className="flex items-center gap-2 text-sm text-stone-600 hover:text-[#2D6A4F] transition-colors py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] rounded"
          >
            ← צפייה בדף הציבורי של העסק
          </Link>
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-2 text-sm text-stone-600 hover:text-[#2D6A4F] transition-colors py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] rounded"
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
      className="brand-panel-soft poster-hover p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F]"
    >
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-stone-500 text-sm">{label}</span></div>
      <p className="font-display font-bold text-xl text-stone-900">{value}</p>
    </Link>
  );
}
