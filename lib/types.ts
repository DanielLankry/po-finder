export type UserRole = "customer" | "business_owner";

export type BusinessCategory =
  | "coffee"    // קפה ושתייה
  | "food"      // אוכל (כולל פסטה, פיצה, אוכל רחוב)
  | "sweets"    // מתוקים ומאפים
  | "meat"      // בשרים
  | "vegan"     // טבעוני וצמחוני
  | "celiac"    // ידידותי לצליאקים
  | "flowers"   // פרחים
  | "jewelry"   // תכשיטים
  | "vintage";  // וינטג׳ ויד שנייה

export type KashrutStatus = "kosher" | "kosher_mehadrin" | "none";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  category: BusinessCategory;
  address: string | null;
  lat: number | null;
  lng: number | null;
  weekly_hours: WeeklyHours | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  instagram: string | null;
  kashrut: KashrutStatus;
  business_number: string | null;
  avg_rating: number;
  review_count: number;
  is_active: boolean;
  created_at: string;
}

export interface BusinessSchedule {
  id: string;
  business_id: string;
  date: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  open_time: string | null;
  close_time: string | null;
  note: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  business_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user?: Pick<User, "name" | "avatar_url">;
}

export interface Photo {
  id: string;
  business_id: string;
  url: string;
  is_primary: boolean;
  created_at: string;
}

export interface DayHours {
  open: string;
  close: string;
}

export interface WeeklyHours {
  sun?: DayHours;
  mon?: DayHours;
  tue?: DayHours;
  wed?: DayHours;
  thu?: DayHours;
  fri?: DayHours;
  sat?: DayHours;
}

export interface WeeklyScheduleEntry {
  id: string;
  business_id: string;
  day_of_week: number; // 0=Sun, 6=Sat
  is_active: boolean;
  open_time: string | null;
  close_time: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessWithSchedule extends Business {
  today_schedule?: BusinessSchedule | null;
  photos?: Photo[];
}

export const CATEGORY_LABELS: Record<BusinessCategory, string> = {
  coffee:  "קפה ושתייה",
  food:    "אוכל",
  sweets:  "מתוקים ומאפים",
  meat:    "בשרים",
  vegan:   "טבעוני וצמחוני",
  celiac:  "ידידותי לצליאקים",
  flowers: "פרחים",
  jewelry: "תכשיטים",
  vintage: "וינטג׳ ויד שנייה",
};

export const KASHRUT_LABELS: Record<KashrutStatus, string> = {
  kosher: "כשר",
  kosher_mehadrin: "כשר למהדרין",
  none: "ללא כשרות",
};

export interface BusinessEvent {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  price: number | null;
  image_url: string | null;
  created_at: string;
}

export const HEBREW_DAYS: Record<string, string> = {
  sun: "ראשון",
  mon: "שני",
  tue: "שלישי",
  wed: "רביעי",
  thu: "חמישי",
  fri: "שישי",
  sat: "שבת",
};

// ── Spots ──────────────────────────────────────────────────────────────────

export type SpotDuration = 1 | 3 | 7 | 14 | 30;
export type SpotStatus = "pending" | "approved" | "rejected" | "expired";

export const SPOT_PLANS: { days: SpotDuration; price: number; label: string; sublabel: string }[] = [
  { days: 1,  price: 1900,  label: "יום אחד",     sublabel: "24 שעות" },
  { days: 3,  price: 3900,  label: "3 ימים",       sublabel: "סוף שבוע" },
  { days: 7,  price: 6900,  label: "שבוע",         sublabel: "מומלץ" },
  { days: 14, price: 10900, label: "שבועיים",      sublabel: "לאירועים" },
  { days: 30, price: 17900, label: "חודש",         sublabel: "עונתי" },
];

export interface Spot {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  category: BusinessCategory;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  photo_url: string | null;
  starts_at: string;
  expires_at: string;
  duration_days: number;
  stripe_payment_intent_id: string | null;
  amount_paid: number;
  status: SpotStatus;
  admin_note: string | null;
  approved_at: string | null;
  created_at: string;
}
