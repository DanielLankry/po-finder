import type { DriveStep } from "driver.js";

export interface TourStep extends DriveStep {
  /** Route on which this step must fire. */
  route: string;
  /** CSS selector for the element to spotlight. Omit for a centered modal. */
  selector?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    route: "/dashboard",
    popover: {
      title: "ברוכים הבאים ללוח הבקרה 👋",
      description:
        "נעבור יחד על ארבעת השלבים להעלאת העסק שלכם למפה. זה ייקח פחות מדקה.",
      side: "over",
      align: "center",
    },
  },
  {
    route: "/dashboard",
    selector: "[data-tour=\"sidebar\"]",
    popover: {
      title: "ניווט",
      description:
        "מכאן עוברים בין הפרופיל, לוח הזמנים, התמונות והאירועים של העסק.",
      side: "left",
      align: "start",
    },
  },
  {
    route: "/dashboard/profile",
    selector: "[data-tour=\"profile-name\"]",
    popover: {
      title: "פרטי העסק",
      description:
        "התחילו כאן — שם העסק, קטגוריה, וסטטוס כשרות. השם והקטגוריה הם שדות חובה.",
      side: "bottom",
      align: "start",
    },
  },
  {
    route: "/dashboard/profile",
    selector: "[data-tour=\"profile-address\"]",
    popover: {
      title: "מיקום",
      description:
        "בחרו כתובת — שם לקוחות ימצאו אתכם על המפה. אפשר לחפש לפי שם רחוב או עיר.",
      side: "bottom",
      align: "start",
    },
  },
  {
    route: "/dashboard/profile",
    selector: "[data-tour=\"profile-save\"]",
    popover: {
      title: "שמירה",
      description:
        "לחצו על 'יצירת עסק' כדי להמשיך. תוכלו לערוך את הפרטים בכל זמן.",
      side: "top",
      align: "center",
    },
  },
  {
    route: "/dashboard/schedule",
    selector: "[data-tour=\"schedule-template\"]",
    popover: {
      title: "לוח זמנים שבועי",
      description:
        "פרסמו את שעות הפעילות הקבועות שלכם לכל ימי השבוע. ניתן לשנות יום בודד בטאב 'תיקון להיום'.",
      side: "bottom",
      align: "start",
    },
  },
  {
    route: "/dashboard/photos",
    selector: "[data-tour=\"photos-upload\"]",
    popover: {
      title: "תמונות העסק",
      description:
        "העלו לפחות תמונה אחת — זו שתופיע ראשית בכרטיס שלכם על המפה. PNG/JPG/WEBP עד 10MB.",
      side: "bottom",
      align: "start",
    },
  },
  {
    route: "/dashboard/events",
    selector: "[data-tour=\"events-new\"]",
    popover: {
      title: "אירועים מיוחדים",
      description:
        "סיימתם! כאן תוכלו בעתיד להוסיף הופעות, מכירות, או אירועים חד-פעמיים שיוצגו בדף העסק.",
      side: "bottom",
      align: "end",
    },
  },
];

/** Route a user should land on at a given step index. */
export function routeForStep(stepIndex: number): string {
  return TOUR_STEPS[stepIndex]?.route ?? "/dashboard";
}

/** Index of the first step that lives on the given route, or -1. */
export function firstStepOnRoute(pathname: string): number {
  return TOUR_STEPS.findIndex((s) => s.route === pathname);
}
