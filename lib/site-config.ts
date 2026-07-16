export const BRAND_NAME = "פה קרוב";
export const SITE_DOMAIN = "pokarov.co.il";
export const SITE_URL = `https://${SITE_DOMAIN}`;

export const BUSINESS_INFO = {
  businessDisplayName: BRAND_NAME,
  legalBusinessName: "דניאל לונקרי",
  businessId: "322303736",
  address: "האירוס, מטולה",
  whatsappNumber: "+972-58-424-2554",
  contactEmail: "support@pokarov.co.il",
  founderName: null as string | null,
};

export const LAUNCH_OFFER = {
  regularPriceText: "₪20–₪250 לפי משך ההופעה",
  noCommitmentText: "ללא חידוש אוטומטי",
  mainCtaText: "טיוטה בחינם, ואז בוחרים מיום אחד עד 12 חודשי הופעה.",
  primaryButtonText: "יצירת טיוטה בחינם",
  secondaryText: "תשלום חד־פעמי בלבד — בלי מנוי, בלי קידום ובלי חיוב חוזר.",
  pricingSummary:
    "יוצרים טיוטת עסק בחינם. לאחר אימות בוחרים מיום אחד ועד 12 חודשים ומשלמים פעם אחת עבור זמן ההופעה באתר.",
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
    answer: "אין חידוש אוטומטי. כל תקופת הופעה נרכשת בתשלום חד־פעמי; ביטולים והחזרים כפופים למדיניות האתר.",
  },
  {
    question: "מה קורה כשנגמר הזמן?",
    answer: "העסק יורד אוטומטית מהמפה, מהחיפוש ומעמוד העסק. לוח הבקרה נשאר זמין ואפשר לחדש בכל עת.",
  },
  {
    question: "מה קורה אם מחדשים לפני התפוגה?",
    answer: "הזמן החדש מתווסף לתאריך התפוגה הקיים, כך שלא מאבדים ימים שכבר שולמו.",
  },
];

export function getWhatsAppHref(number = BUSINESS_INFO.whatsappNumber) {
  if (!number) return null;
  const digits = number.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}
