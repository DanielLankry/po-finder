import type { BusinessCategory } from "@/lib/types";

export interface CategoryTheme {
  background: string;
  ink: string;
  accent: string;
}

/** Shared category colors for cards, chips, and map markers. */
export const CATEGORY_THEME: Record<BusinessCategory, CategoryTheme> = {
  coffee: { background: "#FFF3B0", ink: "#7A4B00", accent: "#F4B942" },
  food: { background: "#FFE1C7", ink: "#9A3412", accent: "#F28C4B" },
  sweets: { background: "#FCE1ED", ink: "#9D174D", accent: "#E879A9" },
  meat: { background: "#FAD7D2", ink: "#8F2525", accent: "#D85C4A" },
  vegan: { background: "#DDF2D8", ink: "#1F6B3A", accent: "#65A95D" },
  celiac: { background: "#F8EDB4", ink: "#72540C", accent: "#D9B44A" },
  flowers: { background: "#F8DDEA", ink: "#8D2452", accent: "#D96A9D" },
  jewelry: { background: "#E8DFF7", ink: "#5D3A9B", accent: "#9173C7" },
  vintage: { background: "#E4E0F4", ink: "#51358B", accent: "#8067B7" },
};
