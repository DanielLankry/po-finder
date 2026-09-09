import type { Business, BusinessSchedule, WeeklyScheduleEntry } from "./types";
import { getOwnerLifecycleDetails } from "./owner-lifecycle";

export type CompletionItem = { id: string; label: string; complete: boolean; href: string; help: string };
export type JourneyStep = { label: string; state: "complete" | "current" | "upcoming" };
export type OwnerJourney = {
  steps: JourneyStep[]; title: string; description: string; responsible: string;
  actionLabel: string; actionHref: string; publicVisible: boolean;
  paymentActionBlocked: boolean;
};
export type OwnerProgressData = {
  business: Business | null;
  businesses: { id: string; name: string }[];
  emailVerified: boolean;
  completion: { items: CompletionItem[]; completed: number; total: number; percent: number };
  journey: OwnerJourney;
  daily: BusinessSchedule[];
  weekly: WeeklyScheduleEntry[];
  updatedAt: string;
};

/** Keeps completion links and dashboard navigation scoped to the chosen business. */
export function ownerPath(path: string, businessId?: string | null): string {
  if (!businessId || !path.startsWith("/dashboard")) return path;
  const [base, hash] = path.split("#");
  const [pathname, query] = base.split("?");
  const params = new URLSearchParams(query);
  params.set("businessId", businessId);
  return `${pathname}?${params}${hash ? `#${hash}` : ""}`;
}

/** Scores saved profile content only; this is guidance, never a publication entitlement. */
export function getProfileCompletion(
  business: Business | null,
  photos: { is_primary: boolean; url: string }[] = [],
  weekly: WeeklyScheduleEntry[] = [],
  daily: BusinessSchedule[] = [],
  today = "",
) {
  const locationValid = Boolean(business?.address?.trim()) &&
    typeof business?.lat === "number" && Number.isFinite(business.lat) && Math.abs(business.lat) <= 90 &&
    typeof business?.lng === "number" && Number.isFinite(business.lng) && Math.abs(business.lng) <= 180;
  const hasHours = weekly.some((day) => day.is_active && day.open_time && day.close_time && day.open_time !== day.close_time) ||
    (weekly.length === 7 && weekly.every((day) => !day.is_active)) ||
    daily.some((day) => day.date >= today && day.open_time && day.close_time && day.open_time !== day.close_time);
  const items: CompletionItem[] = [
    { id: "identity", label: "שם וקטגוריה", complete: Boolean(business?.name?.trim() && business.category), href: "/dashboard/profile#business-name", help: "הפרטים הבסיסיים לזיהוי העסק" },
    { id: "location", label: "מיקום במפה", complete: locationValid, href: "/dashboard/profile#profile-address", help: "בחירת כתובת עם נקודה תקינה במפה" },
    { id: "contact", label: "דרך יצירת קשר", complete: Boolean(business?.phone?.trim() || business?.website?.trim() || business?.instagram?.trim()), href: "/dashboard/profile#business-phone", help: "טלפון, אתר או Instagram" },
    { id: "description", label: "תיאור העסק", complete: Boolean(business?.description?.trim()), href: "/dashboard/profile#business-description", help: "כמה מילים על מה שאפשר למצוא אצלכם" },
    { id: "photo", label: "תמונה ראשית", complete: photos.some((photo) => photo.is_primary && Boolean(photo.url?.trim())), href: "/dashboard/photos#photos-upload", help: "תמונה שעלתה ונשמרה בהצלחה" },
    { id: "hours", label: "שעות פעילות", complete: hasHours, href: "/dashboard/schedule?tab=weekly#schedule-template", help: "שעות שבועיות או עדכון יומי; אם השעות משתנות, עדכנו אותן כשידועות" },
  ].map((item) => ({ ...item, href: ownerPath(item.href, business?.id) }));
  const completed = items.filter((item) => item.complete).length;
  return { items, completed, total: items.length, percent: Math.round(completed / items.length * 100) };
}

/** Derives one honest next step from server-confirmed identity, approval and entitlement. */
export function getOwnerJourney(
  business: Business | null,
  emailVerified: boolean,
  nowIso: string,
  pendingPayment = false,
): OwnerJourney {
  const lifecycle = business ? getOwnerLifecycleDetails(business, nowIso) : null;
  const publicVisible = lifecycle?.publicVisible ?? false;
  const promotion = business?.promotion_code === "first-20-3m";
  const expired = lifecycle?.state === "expired";
  const suspended = Boolean(business?.is_verified && !business.is_active &&
    (business.is_legacy_public || (business.expires_at && Date.parse(business.expires_at) > Date.parse(nowIso))));
  const index = !emailVerified ? 0 : !business ? 1 : !business.is_verified ? 2 : publicVisible ? 5 : 3;
  const labels = ["אימות מייל", "פרופיל עסק", "אישור הצוות", promotion ? "הטבה או תשלום" : "תשלום", "פרסום"];
  const steps: JourneyStep[] = labels.map((label, i) => ({ label, state: i < index ? "complete" : i === index ? "current" : "upcoming" }));
  let title = "השלב הבא: יצירת פרופיל עסק";
  let description = "שומרים טיוטה פרטית בחינם. אחר כך הצוות יבדוק את פרטי העסק.";
  let responsible = "אצלכם";
  let actionLabel = "יצירת פרופיל";
  let actionHref = "/dashboard/profile";
  if (!emailVerified) {
    title = "צריך לאמת את כתובת המייל";
    description = "פתחו את הודעת האימות שקיבלתם כדי להשלים את ההרשמה.";
    actionLabel = "כניסה ושליחה חוזרת"; actionHref = "/auth/login";
  } else if (business && !business.is_verified) {
    title = "פרטי העסק נשמרו וממתינים לאישור הצוות";
    description = promotion
      ? "המקום בהטבה שמור. אחרי אישור הצוות העסק יתפרסם ויתחילו שלושת החודשים החינם, ללא תשלום. אפשר להשלים תמונות ושעות בינתיים."
      : "העסק עדיין פרטי. אחרי אישור הצוות אפשר יהיה לבחור תקופה ולשלם. אפשר להשלים תמונות ושעות בינתיים.";
    responsible = "הצוות · נעדכן במייל"; actionLabel = "בדיקת פרטי העסק";
  } else if (publicVisible) {
    title = "העסק מופיע לציבור";
    description = lifecycle!.description;
    responsible = "אין פעולה נדרשת לפרסום";
    actionLabel = "צפייה בכרטיס העסק"; actionHref = `/businesses/${business!.id}`;
  } else if (suspended) {
    title = "פרסום העסק מושהה";
    description = "קיימת תקופה בתוקף, אבל העסק אינו פעיל לציבור כרגע. פנו לצוות לבירור לפני תשלום נוסף.";
    responsible = "הצוות"; actionLabel = "פנייה לצוות"; actionHref = "/contact";
    steps[3].state = "complete"; steps[4].state = "current";
  } else if (business?.is_verified) {
    title = pendingPayment ? "התשלום עדיין בבדיקה" : expired ? "תקופת הפרסום הסתיימה" : "הצוות אישר את העסק — נשאר לבחור תקופה";
    description = pendingPayment
      ? "עדיין אין אישור סופי לתשלום. בדקו את מצב העסקה לפני ניסיון תשלום נוסף."
      : expired ? "הפרופיל והשעות נשמרו. אפשר לחדש תקופה כדי להחזיר את העסק לציבור."
      : "המייל ופרטי העסק אושרו. העסק יתפרסם לאחר תשלום מוצלח.";
    responsible = pendingPayment ? "הצוות וספק התשלום" : "אצלכם";
    actionLabel = pendingPayment ? "בירור התשלום" : expired ? "חידוש תקופה" : "בחירת תקופה";
    actionHref = pendingPayment ? "/contact" : "/dashboard/billing";
  }
  return { steps, title, description, responsible, actionLabel, actionHref: ownerPath(actionHref, business?.id), publicVisible, paymentActionBlocked: pendingPayment || suspended };
}
