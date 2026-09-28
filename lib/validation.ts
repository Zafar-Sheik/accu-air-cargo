import { z } from "zod";
export const email = z.string().trim().toLowerCase().email().max(191);
export const password = z
  .string()
  .min(12, "Use at least 12 characters")
  .max(72);
export const address = z.object({
  name: z.string().min(2).max(120),
  phone: z
    .string()
    .regex(/^(\+27|0)[0-9\s-]{9,13}$/, "Enter a South African phone number"),
  street: z.string().min(5).max(200),
  city: z.string().min(2).max(80),
  province: z.string().min(2).max(50),
  postalCode: z.string().regex(/^\d{4}$/, "Use a four-digit postal code"),
});
export const parcel = z.object({
  description: z.string().min(2).max(200),
  quantity: z.coerce.number().int().min(1).max(100),
  length: z.coerce.number().positive().max(1000),
  width: z.coerce.number().positive().max(1000),
  height: z.coerce.number().positive().max(1000),
  weight: z.coerce.number().positive().max(100000),
});
export const quote = z.object({
  email,
  kind: z.enum(["domestic", "international"]),
  originPostalCode: z.string().max(12).default(""),
  destinationPostalCode: z.string().max(12).default(""),
  origin: z.string().min(5).max(500),
  destination: z.string().min(5).max(500),
  pickupDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(
      (v) =>
        v >=
        new Intl.DateTimeFormat("en-CA", {
          timeZone: "Africa/Johannesburg",
        }).format(new Date()),
      "Collection date cannot be in the past",
    ),
  parcels: z.array(parcel).min(1).max(30),
  instructions: z.string().max(3000).default(""),
  service: z.enum(["Economy", "Express", "Air freight", "Sea freight"]),
  declaredValue: z.coerce.number().min(0).max(100000000),
  dangerousGoods: z.boolean(),
  acceptTerms: z.literal(true),
});
export const productInput = z.object({
  name: z.string().min(3).max(180),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(180),
  description: z.string().min(3).max(10000),
  category: z.string().min(2).max(80),
  image: z
    .string()
    .refine(
      (s) =>
        (s.startsWith("/images/") && !s.includes("..")) ||
        (!!process.env.R2_PUBLIC_URL &&
          s.startsWith(
            process.env.R2_PUBLIC_URL.replace(/\/$/, "") + "/products/",
          )),
      "Use a local /images/ asset path",
    ),
  active: z.boolean(),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        sku: z.string().min(2).max(100),
        name: z.string().min(1).max(100),
        price: z.coerce.number().int().min(1).max(100000000),
        stock: z.coerce.number().int().min(0).max(1000000),
        active: z.boolean().default(true),
      }),
    )
    .min(1)
    .max(40),
});

export const shippingRuleInput = z
  .object({
    name: z.string().min(3).max(100),
    originPrefix: z.string().regex(/^\d{1,4}$/),
    destinationPrefix: z.string().regex(/^\d{1,4}$/),
    basePrice: z.number().int().min(1),
    includedGrams: z.number().int().min(0),
    maximumGrams: z.number().int().min(1).max(250000),
    perKg: z.number().int().min(0),
    divisor: z.number().int().min(1000).max(10000),
    fuelBps: z.number().int().min(0).max(10000),
    taxBps: z.number().int().min(0).max(10000),
    surcharge: z.number().int().min(0),
    active: z.boolean(),
  })
  .refine(
    (v) => v.maximumGrams >= v.includedGrams,
    "Maximum weight must include the base weight",
  );
