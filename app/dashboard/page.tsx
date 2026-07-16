import Link from "next/link";
import { Plus, Clock, Star, Camera, MapPin, MessageCircle, Eye, Phone, Clock3, Hand } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBusinessesByOwner } from "@/lib/db/businesses";
import { getTodaySchedule } from "@/lib/db/schedules";
import { isOpenNow } from "@/lib/utils/schedule";
import type { Business } from "@/lib/types";
import BusinessSelector from "@/components/dashboard/BusinessSelector";
import ShareButtons from "@/components/business/ShareButtons";

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
        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border-2 border-red-700 bg-red-100 text-red-700 shadow-[2px_2px_0_0_#B91C1C] hover:bg-red-200 transition-colors"
      >
        תוקף פג — חדשו עכשיו
      </Link>
    );
  }
  if (daysLeft <= 7) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border-2 border-amber-700 bg-amber-100 text-amber-700 shadow-[2px_2px_0_0_#B45309]">
        פעיל עד {formatted}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border-2 border-[#2D6A4F] bg-emerald-100 text-[#2D6A4F] shadow-[2px_2px_0_0_#2D6A4F]">
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
  const whatsappCount = analyticsData?.filter((e: { event_type: string }) => e.event_type === "whatsapp_click").length ?? 0;

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
          <ExpiryBadge expiresAt={(business as unknown as Record<string, unknown>).expires_at as string | null} />
        </div>
        <p className="relative text-stone-600 text-sm mt-1">
          ברוכים הבאים ללוח הבקרה של{" "}
          <span className="font-medium text-stone-700">{business.name}</span>
        </p>
      </div>

      {/* Verification and paid visibility are separate lifecycle states. */}
      {!business.is_verified && (
        <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-700 rounded-[18px] p-5 shadow-[3px_3px_0_0_#B45309]">
          <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Clock3 className="h-5 w-5 text-amber-600" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-amber-900 text-sm">הטיוטה ממתינה לאימות</p>
            <p className="text-amber-700 text-xs mt-1 leading-relaxed">
              פרטי העסק נשמרו באופן פרטי. הצוות יאמת את העסק, ואז יהיה אפשר לבחור את משך ההופעה ולהעלות אותו לאוויר.
            </p>
          </div>
        </div>
      )}

      {business.is_verified && !business.is_active && (
        <div className="brand-panel-orange flex items-start gap-3 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF3B0]"><Clock3 className="h-5 w-5 text-[#8A3618]" /></div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-stone-950">העסק מאומת, אבל לא מופיע לציבור</p>
            <p className="mt-1 text-xs leading-relaxed text-stone-600">בחרו מיום אחד ועד 12 חודשים ושלמו פעם אחת עבור זמן ההופעה.</p>
            <Link href="/dashboard/billing" className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-[#8A3618] px-4 py-2 text-xs font-bold text-white">לבחירת משך הופעה</Link>
          </div>
        </div>
      )}

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
        <div className="brand-rule mb-5" aria-hidden="true" />
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
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
          <div className="rounded-xl bg-[#F6E3D9] p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <MessageCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
            </div>
            <p className="font-display font-bold text-2xl text-stone-900">{whatsappCount}</p>
            <p className="text-stone-500 text-xs mt-0.5">וואטסאפ</p>
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
