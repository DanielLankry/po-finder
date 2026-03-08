export type UserRole = "customer" | "business_owner";

export type BusinessCategory = "coffee" | "sweets" | "meat" | "pasta" | "pizza";

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

export interface BusinessWithSchedule extends Business {
  today_schedule?: BusinessSchedule | null;
  photos?: Photo[];
}

export const CATEGORY_LABELS: Record<BusinessCategory, string> = {
  coffee: "קפה",
  sweets: "מתוקים",
  meat: "בשרים",
  pasta: "פסטה",
  pizza: "פיצה",
};

export const KASHRUT_LABELS: Record<KashrutStatus, string> = {
  kosher: "כשר",
  kosher_mehadrin: "כשר למהדרין",
  none: "ללא כשרות",
};

export const HEBREW_DAYS: Record<string, string> = {
  sun: "ראשון",
  mon: "שני",
  tue: "שלישי",
  wed: "רביעי",
  thu: "חמישי",
  fri: "שישי",
  sat: "שבת",
};
