export type OwnerLifecycleInput = {
  expires_at?: string | null;
  is_active: boolean;
  is_legacy_public?: boolean | null;
  is_verified?: boolean | null;
  promotion_code?: string | null;
  promotion_reserved_at?: string | null;
  promotion_activated_at?: string | null;
};

export type OwnerLifecycleState =
  | "pending_verification"
  | "promotion_reserved"
  | "ready_to_publish"
  | "active"
  | "expiring_soon"
  | "expired";

export type OwnerLifecycleTone = "success" | "warning" | "error" | "neutral";

export type OwnerTransientState =
  | "loading"
  | "empty"
  | "offline"
  | "error"
  | "permission"
  | "destructive"
  | "payment_success"
  | "payment_processing"
  | "payment_cancelled"
  | "payment_failed";

export type OwnerPaymentTransientState = Extract<
  OwnerTransientState,
  | "payment_success"
  | "payment_processing"
  | "payment_cancelled"
  | "payment_failed"
>;

export type OwnerPaymentAttemptInput = {
  status: "pending" | "succeeded" | "failed" | "refunded";
  hyp_response_code?: string | null;
};

export type OwnerTransientDetails = {
  state: OwnerTransientState;
  tone: OwnerLifecycleTone;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  live: "polite" | "assertive";
};

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
  const usesExpiry = hasValidExpiry && business.is_legacy_public !== true;
  const daysLeft = usesExpiry ? Math.ceil((expiryMs - nowMs) / DAY_MS) : null;
  const formattedExpiry = usesExpiry ? formatHebrewDate(business.expires_at!) : null;
  const publicVisible =
    isVerified &&
    business.is_active &&
    (business.is_legacy_public === true || (hasValidExpiry && expiryMs > nowMs));

  if (!isVerified) {
    if (
      business.promotion_code === "first-20-3m" &&
      business.promotion_reserved_at &&
      !business.promotion_activated_at
    ) {
      return {
        state: "promotion_reserved",
        tone: "warning",
        title: "המקום נשמר והטיוטה ממתינה לאימות",
        description:
          "פרטי העסק נשמרו באופן פרטי. לאחר אישור מנהל העסק יעלה לאוויר, ורק אז יתחילו 3 החודשים החינם.",
        pill: "מקום שמור במבצע",
        actionHref: "/dashboard/profile",
        actionLabel: "בדיקת פרטי העסק",
        daysLeft,
        formattedExpiry,
        publicVisible: false,
      };
    }

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
    if (usesExpiry && expiryMs <= nowMs) {
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

export function getOwnerTransientDetails(
  state: OwnerTransientState,
  message?: string | null,
): OwnerTransientDetails {
  switch (state) {
    case "loading":
      return {
        state,
        tone: "neutral",
        title: "טוענים את פרטי העסק",
        description: message ?? "בודקים את מצב הטיוטה, האימות והתשלום.",
        live: "polite",
      };
    case "empty":
      return {
        state,
        tone: "neutral",
        title: "עדיין אין טיוטת עסק",
        description: message ?? "לפני תשלום יוצרים טיוטה פרטית בחינם. היא לא תופיע לציבור עד אימות ותשלום.",
        actionHref: "/dashboard/profile",
        actionLabel: "יצירת טיוטה",
        live: "polite",
      };
    case "offline":
      return {
        state,
        tone: "warning",
        title: "אין חיבור זמין",
        description: message ?? "לא הצלחנו לרענן את מצב העסק. בדקו את החיבור ונסו שוב.",
        live: "assertive",
      };
    case "error":
      return {
        state,
        tone: "error",
        title: "משהו השתבש",
        description: message ?? "לא הצלחנו להשלים את הפעולה. נסו שוב או פנו לתמיכה.",
        live: "assertive",
      };
    case "permission":
      return {
        state,
        tone: "error",
        title: "אין הרשאה לעסק הזה",
        description: message ?? "אפשר לערוך ולשלם רק על עסקים שמחוברים לחשבון שלכם.",
        actionHref: "/dashboard",
        actionLabel: "חזרה ללוח הבקרה",
        live: "assertive",
      };
    case "destructive":
      return {
        state,
        tone: "warning",
        title: "פעולה רגישה",
        description: message ?? "לפני מחיקה או ביטול נציג בדיוק מה יקרה ונבקש אישור מפורש.",
        live: "assertive",
      };
    case "payment_success":
      return {
        state,
        tone: "success",
        title: "התשלום נקלט",
        description: message ?? "הזמן נוסף לעסק. אם העסק מאומת, הוא מופיע לציבור לפי התוקף החדש.",
        live: "polite",
      };
    case "payment_processing":
      return {
        state,
        tone: "warning",
        title: "התשלום בבדיקה",
        description: message ?? "לא צריך לשלם שוב. נשמור את הניסיון פתוח עד שהחיוב והזכאות יתאימו.",
        live: "polite",
      };
    case "payment_cancelled":
      return {
        state,
        tone: "warning",
        title: "התשלום בוטל",
        description: message ?? "לא בוצע חיוב פעיל. אפשר לבחור משך אחר או לנסות שוב מאותו מסך.",
        live: "polite",
      };
    case "payment_failed":
      return {
        state,
        tone: "error",
        title: "התשלום לא הושלם",
        description: message ?? "העסק לא פורסם בעקבות ניסיון התשלום הזה. אפשר לנסות שוב או לפנות לתמיכה.",
        live: "assertive",
      };
  }
}

export function getOwnerPaymentTransientState(
  attempt: OwnerPaymentAttemptInput | null,
): OwnerPaymentTransientState | null {
  if (!attempt || attempt.status === "refunded") return null;
  if (attempt.status === "succeeded") return "payment_success";
  if (attempt.status === "pending") return "payment_processing";
  return attempt.hyp_response_code === "cancelled"
    ? "payment_cancelled"
    : "payment_failed";
}

function formatHebrewDate(value: string): string {
  return new Date(value).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jerusalem",
  });
}
