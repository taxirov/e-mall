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

export const productSchema = z.object({
  mxikItemId: z.string().min(1, "Mahsulotni katalogdan tanlang"),
  name: z.string().min(1, "Mahsulot nomi kiritilishi shart"),
  sku: z.string().optional().nullable(),
  price: z.coerce.number().positive("Narx musbat bo'lishi kerak"),
  stock: z.coerce.number().int().min(0, "Qoldiq manfiy bo'lishi mumkin emas"),
  isPublished: z.coerce.boolean().default(false),
});
export type ProductInput = z.infer<typeof productSchema>;

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
