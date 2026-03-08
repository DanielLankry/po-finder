export const PLANS = {
  business: {
    name: "עסק בפה",
    price: 5, // USD
    priceDisplay: "$5",
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
