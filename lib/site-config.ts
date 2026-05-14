export const BRAND_NAME = "פה קרוב";
export const SITE_DOMAIN = "pokarov.co.il";
export const SITE_URL = `https://${SITE_DOMAIN}`;

export const BUSINESS_INFO = {
  businessDisplayName: BRAND_NAME,
  legalBusinessName: null as string | null,
  businessId: null as string | null,
  address: null as string | null,
  whatsappNumber: null as string | null,
  contactEmail: "support@pokarov.co.il",
  founderName: null as string | null,
};

export const LAUNCH_OFFER = {
  regularPriceText: "₪270 לחודש",
  launchPriceText: "₪99 לחודש ל־3 חודשים",
  noCommitmentText: "ללא התחייבות",
  mainCtaText: "מחיר השקה לעסקים הראשונים: ₪99 לחודש ל־3 חודשים, ללא התחייבות.",
  primaryButtonText: "הצטרפו במחיר השקה",
  secondaryText: "כולל הקמת פרופיל ראשוני בחינם.",
  pricingSummary:
    "המחיר הרגיל הוא ₪270 לחודש. בתקופת ההשקה, עסקים ראשונים מצטרפים במחיר של ₪99 לחודש ל־3 חודשים, ללא התחייבות.",
};

export const VENDOR_FAQS = [
  {
    question: "למי השירות מתאים?",
    answer:
      "השירות מתאים לדוכנים, עגלות קפה, עסקים ניידים, עסקים מקומיים קטנים, ירידים, שווקים ועסקים שרוצים שלקוחות ימצאו אותם לפי מיקום.",
  },
  {
    question: "האם הלקוחות צריכים להוריד אפליקציה?",
    answer: "לא. הלקוחות נכנסים לאתר ורואים עסקים קרובים על המפה.",
  },
  {
    question: "מה כלול במחיר?",
    answer: "פרופיל עסק, תמונות, מיקום, שעות פעילות, כפתור התקשרות, ביקורות וסטטיסטיקות בסיסיות.",
  },
  {
    question: "האם יש עמלה על מכירות?",
    answer: "לא. התשלום הוא עבור הופעה בפלטפורמה, לא עמלה על מכירות.",
  },
  {
    question: "האם אפשר לבטל?",
    answer: "כן. אין התחייבות בתקופת ההשקה.",
  },
  {
    question: "האם אתם מקימים את הפרופיל?",
    answer: "כן. בתקופת ההשקה מוצעת הקמת פרופיל ראשוני בחינם לעסקים הראשונים.",
  },
];

export function getWhatsAppHref(number = BUSINESS_INFO.whatsappNumber) {
  if (!number) return null;
  const digits = number.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}
