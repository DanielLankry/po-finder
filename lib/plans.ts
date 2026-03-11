export const PLANS = {
  business: {
    name: "עסק בפה",
    price: 25, // ILS
    priceDisplay: "₪25",
    interval: "month" as const,
    features: [
      "הופעה על המפה",
      "פרופיל עסק מלא",
      "ניהול שעות פעילות",
      "העלאת תמונות",
      "קבלת ביקורות",
      "סטטיסטיקות בסיסיות",
    ],
  },
} as const;
