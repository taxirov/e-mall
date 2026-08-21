import { z } from "zod";

export const phoneSchema = z
  .string()
  .regex(/^\+998\d{9}$/, "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak");

export const registerStoreSchema = z.object({
  fullName: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  phone: phoneSchema,
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
  storeName: z.string().min(2, "Do'kon nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
});
export type RegisterStoreInput = z.infer<typeof registerStoreSchema>;

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Parol kiritilishi shart"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const inviteSellerSchema = z.object({
  fullName: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  phone: phoneSchema,
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
});
export type InviteSellerInput = z.infer<typeof inviteSellerSchema>;

export const UNIT_OPTIONS = [
  "dona",
  "kg",
  "gramm",
  "litr",
  "ml",
  "metr",
  "m2",
  "quti",
  "blok",
  "boshqa",
] as const;

/** Shared/global catalog-product fields — used both for a store's "create new" flow and for admin's direct catalog management. */
export const catalogProductSchema = z.object({
  name: z.string().min(1, "Mahsulot nomi kiritilishi shart"),
  categoryId: z.string().min(1, "Kategoriya tanlanishi shart"),
  brand: z.string().optional().nullable(),
  unit: z.string().min(1, "O'lchov birligi tanlanishi shart"),
  size: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  description: z.string().max(1000, "Tavsif 1000 ta belgidan oshmasligi kerak").optional().nullable(),
  imageUrl: z.string().optional().nullable(),
});
export type CatalogProductInput = z.infer<typeof catalogProductSchema>;

/** A store's product listing — either attaches an existing catalog product or defines a brand-new one (never both). */
export const productSchema = z
  .object({
    catalogProductId: z.string().optional().nullable(),
    newCatalogProduct: catalogProductSchema.optional().nullable(),
    sku: z.string().optional().nullable(),
    price: z.coerce.number().positive("Narx musbat bo'lishi kerak"),
    costPrice: z.coerce.number().min(0, "Kelgan narx manfiy bo'lishi mumkin emas").optional().nullable(),
    stock: z.coerce.number().int().min(0, "Qoldiq manfiy bo'lishi mumkin emas"),
    lowStockThreshold: z.coerce.number().int().min(0, "Chegara manfiy bo'lishi mumkin emas").optional().nullable(),
    expiryDate: z.string().optional().nullable(),
    supplier: z.string().optional().nullable(),
    isPublished: z.coerce.boolean().default(false),
  })
  .refine((data) => Boolean(data.catalogProductId) !== Boolean(data.newCatalogProduct), {
    message: "Mavjud mahsulotni tanlang yoki yangisini yarating",
    path: ["catalogProductId"],
  });
export type ProductInput = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, "Nomi kiritilishi shart"),
  parentId: z.string().optional().nullable(),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const editRequestSchema = z.object({
  changes: z.record(z.string(), z.unknown()).refine((c) => Object.keys(c).length > 0, "Hech bo'lmaganda bitta maydon o'zgartirilishi kerak"),
  note: z.string().max(500, "Izoh 500 ta belgidan oshmasligi kerak").optional().nullable(),
});
export type EditRequestInput = z.infer<typeof editRequestSchema>;

export const stockReceiptSchema = z.object({
  productId: z.string().min(1, "Mahsulot tanlanishi shart"),
  quantity: z.coerce.number().int().positive("Miqdor musbat bo'lishi kerak"),
  costPrice: z.coerce.number().min(0, "Kelgan narx manfiy bo'lishi mumkin emas"),
  sellingPrice: z.coerce.number().positive("Sotish narxi musbat bo'lishi kerak"),
  expiryDate: z.string().optional().nullable(),
  supplier: z.string().optional().nullable(),
});
export type StockReceiptInput = z.infer<typeof stockReceiptSchema>;

export const cartItemSchema = z.object({
  productId: z.string(),
  qty: z.number().int().positive(),
});

export const saleSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Kamida bitta mahsulot tanlang"),
  paymentMethod: z.enum(["CASH", "CARD"]),
});
export type SaleInput = z.infer<typeof saleSchema>;

export const slugSchema = z
  .string()
  .min(3, "Subdomen kamida 3 ta belgidan iborat bo'lishi kerak")
  .max(40, "Subdomen 40 ta belgidan oshmasligi kerak")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Subdomen faqat kichik lotin harflari, raqam va tire (-) dan iborat bo'lishi mumkin");

export const updateStoreSettingsSchema = z.object({
  name: z.string().min(2, "Do'kon nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
  description: z.string().max(500, "Tavsif 500 ta belgidan oshmasligi kerak").optional().nullable(),
  slug: slugSchema,
});
export type UpdateStoreSettingsInput = z.infer<typeof updateStoreSettingsSchema>;

export const placeOrderSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Kamida bitta mahsulot tanlang"),
  address: z.string().min(3, "Manzil kiritilishi shart"),
  phone: phoneSchema,
  note: z.string().optional(),
});
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
