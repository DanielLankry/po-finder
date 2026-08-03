export type OwnerLifecycleInput = {
  expires_at?: string | null;
  is_active: boolean;
  is_legacy_public?: boolean | null;
  is_verified?: boolean | null;
};

export type OwnerLifecycleState =
  | "pending_verification"
  | "ready_to_publish"
  | "active"
  | "expiring_soon"
  | "expired";

export type OwnerLifecycleTone = "success" | "warning" | "error" | "neutral";

export type OwnerLifecycleDetails = {
  state: OwnerLifecycleState;
  tone: OwnerLifecycleTone;
  title: string;
  description: string;
  pill: string;
  actionHref: string;
  actionLabel: string;
  daysLeft: number | null;
  formattedExpiry: string | null;
  publicVisible: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function getOwnerLifecycleDetails(
  business: OwnerLifecycleInput,
  nowIso: string = new Date().toISOString(),
): OwnerLifecycleDetails {
  const isVerified = business.is_verified === true;
  const nowMs = Date.parse(nowIso);
  const expiryMs = business.expires_at ? Date.parse(business.expires_at) : NaN;
  const hasValidExpiry = Number.isFinite(expiryMs);
  const daysLeft = hasValidExpiry ? Math.ceil((expiryMs - nowMs) / DAY_MS) : null;
  const formattedExpiry = hasValidExpiry ? formatHebrewDate(business.expires_at!) : null;
  const publicVisible =
    isVerified &&
    business.is_active &&
    (business.is_legacy_public === true || (hasValidExpiry && expiryMs > nowMs));

  if (!isVerified) {
    return {
      state: "pending_verification",
      tone: "warning",
      title: "הטיוטה ממתינה לאימות",
      description:
        "פרטי העסק נשמרו באופן פרטי. אחרי אימות הצוות אפשר יהיה לבחור משך הופעה ולהעלות את העסק לאוויר.",
      pill: "ממתין לאימות",
      actionHref: "/dashboard/profile",
      actionLabel: "בדיקת פרטי העסק",
      daysLeft,
      formattedExpiry,
      publicVisible: false,
    };
  }

  if (!publicVisible) {
    if (hasValidExpiry && expiryMs <= nowMs) {
      return {
        state: "expired",
        tone: "error",
        title: "תקופת ההופעה הסתיימה",
        description:
          "העסק לא מופיע לציבור כרגע. לוח הבקרה נשאר זמין, ואפשר לבחור משך חדש כדי להחזיר אותו לאתר.",
        pill: "תוקף פג",
        actionHref: "/dashboard/billing",
        actionLabel: "חידוש הופעה",
        daysLeft,
        formattedExpiry,
        publicVisible: false,
      };
    }

    return {
      state: "ready_to_publish",
      tone: "neutral",
      title: "העסק מאומת ומוכן לפרסום",
      description:
        "בחרו מיום אחד ועד 12 חודשים ושלמו פעם אחת. התוקף מתחיל אחרי תשלום מוצלח.",
      pill: "לא מופיע לציבור",
      actionHref: "/dashboard/billing",
      actionLabel: "בחירת משך הופעה",
      daysLeft,
      formattedExpiry,
      publicVisible: false,
    };
  }

  if (daysLeft !== null && daysLeft <= 7) {
    return {
      state: "expiring_soon",
      tone: "warning",
      title: "העסק מופיע לציבור והתוקף קרוב לסיום",
      description: `העסק פעיל עד ${formattedExpiry}. אפשר להאריך עכשיו בלי לשנות את פרטי העסק.`,
      pill: `פעיל עד ${formattedExpiry}`,
      actionHref: "/dashboard/billing",
      actionLabel: "הארכת הופעה",
      daysLeft,
      formattedExpiry,
      publicVisible: true,
    };
  }

  return {
    state: "active",
    tone: "success",
    title: "העסק מופיע לציבור",
    description: formattedExpiry
      ? `העסק פעיל עד ${formattedExpiry}. בסיום התקופה הוא ירד מהאתר אוטומטית.`
      : "העסק פעיל ומופיע לציבור.",
    pill: formattedExpiry ? `פעיל עד ${formattedExpiry}` : "מופיע לציבור",
    actionHref: "/dashboard/billing",
    actionLabel: "ניהול תקופה",
    daysLeft,
    formattedExpiry,
    publicVisible: true,
  };
}

function formatHebrewDate(value: string): string {
  return new Date(value).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
