import { z } from "zod";
export const uuid = z.string().uuid();
export const timezone = z.string().refine((v) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: v });
    return true;
  } catch {
    return false;
  }
}, "Choose a valid IANA time zone");
export const propertySchema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(20).max(5000),
  city: z.string().trim().min(2).max(100),
  province: z.string().trim().min(2).max(100).default("Ontario"),
  university: z.string().max(100).default(""),
  address: z.string().trim().min(5).max(250),
  monthly_rent: z.coerce.number().int().min(1).max(50000),
  room_type: z.enum([
    "Private room",
    "Shared room",
    "Studio",
    "Entire apartment",
  ]),
  bedrooms: z.coerce.number().int().min(0).max(20),
  bathrooms: z.coerce.number().min(0.5).max(20),
  amenities: z.array(z.string().trim().min(1).max(60)).max(30),
  available_from: z.string().date(),
  status: z.enum(["active", "unavailable"]).default("active"),
});
export const filtersSchema = z
  .object({
    city: z.string().trim().max(100).optional(),
    university: z.string().max(100).optional(),
    min: z.coerce.number().min(0).optional(),
    max: z.coerce.number().min(0).optional(),
    room_type: propertySchema.shape.room_type.optional(),
    bedrooms: z.coerce.number().int().min(0).max(20).optional(),
    available: z.string().date().optional(),
    sort: z.enum(["newest", "price-low", "price-high"]).default("newest"),
  })
  .refine(
    (v) => v.min === undefined || v.max === undefined || v.min <= v.max,
    "Minimum budget cannot exceed maximum",
  );
export const slotSchema = z
  .object({
    property_id: uuid,
    start_time: z.string().datetime({ offset: true }),
    end_time: z.string().datetime({ offset: true }),
    viewing_type: z.enum(["virtual", "in-person"]),
    meeting_url: z
      .union([
        z.string().url().startsWith("https://").max(2000),
        z.literal(""),
        z.null(),
      ])
      .optional(),
  })
  .refine(
    (v) => Date.parse(v.end_time) > Date.parse(v.start_time),
    "End time must follow start time",
  );
export const profileSchema = z.object({
  full_name: z.string().trim().min(1).max(100),
  preferred_timezone: timezone,
});
