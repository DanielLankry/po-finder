import { z } from "zod";

const optionalText = (length: number) => z.string().trim().max(length).nullable();

/** Validate owner input on the server; ownership and publication never come from the form. */
export const businessRegistrationSchema = z.object({
  name: z.string().trim().min(1, "נדרש שם עסק").max(100),
  description: optionalText(500),
  category: z.enum(["coffee", "food", "sweets", "meat", "vegan", "celiac", "flowers", "jewelry", "vintage"]),
  kashrut: z.enum(["kosher", "kosher_mehadrin", "none"]),
  phone: optionalText(40),
  website: z.url({ protocol: /^https?$/ }).max(500).nullable(),
  instagram: optionalText(160),
  business_number: optionalText(80),
  address: optionalText(500),
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
}).strict();

export type BusinessRegistrationInput = z.infer<typeof businessRegistrationSchema>;
