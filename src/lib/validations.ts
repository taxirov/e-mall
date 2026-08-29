import { z } from "zod";

export const phoneSchema = z
  .string()
  .regex(/^\+998\d{9}$/, "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak");

/** Letters (any script), digits, spaces, apostrophe variants (o', g'), and hyphens — enough for real store names, not enough for junk like dots/emoji. */
export const STORE_NAME_CHARS_REGEX = /^[\p{L}\p{N}\s'‘’ʻʼ-]+$/u;
export const STORE_NAME_CHARS_HINT =
  "Nomda faqat harflar, raqamlar, bo'sh joy, apostrof (') va tire (-) belgilaridan foydalaning";

export const registerStoreSchema = z.object({
  fullName: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  phone: phoneSchema,
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
  storeName: z
    .string()
    .min(2, "Do'kon nomi kamida 2 ta belgidan iborat bo'lishi kerak")
    .regex(STORE_NAME_CHARS_REGEX, STORE_NAME_CHARS_HINT),
  storeTypeIds: z.array(z.string()).min(1, "Kamida bitta do'kon turi tanlanishi kerak"),
  telegramChatId: z.string().min(1, "Telegram orqali tasdiqlash talab qilinadi"),
  telegramPhone: z.string().optional().nullable(),
});
export type RegisterStoreInput = z.infer<typeof registerStoreSchema>;

export const registerCustomerSchema = z.object({
  fullName: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  phone: phoneSchema,
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
  telegramChatId: z.string().min(1, "Telegram orqali tasdiqlash talab qilinadi"),
  telegramPhone: z.string().optional().nullable(),
});
export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;

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
  soliqId: z.string().optional().nullable(),
  soliqPosition: z.string().optional().nullable(),
  soliqBrand: z.string().optional().nullable(),
  mxikCode: z.string().optional().nullable(),
  /** attributeId -> raw string value; sparse, only attributes the user actually filled in. */
  attributes: z.record(z.string(), z.string()).optional(),
});
export type CatalogProductInput = z.infer<typeof catalogProductSchema>;

export const barcodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6,14}$/, "Shtrix-kod 6-14 xonali raqamdan iborat bo'lishi kerak");

export const PRODUCT_ATTRIBUTE_TYPES = ["TEXT", "NUMBER", "BOOLEAN", "SELECT"] as const;

export const productAttributeSchema = z
  .object({
    name: z.string().min(1, "Nomi kiritilishi shart"),
    type: z.enum(PRODUCT_ATTRIBUTE_TYPES),
    options: z.array(z.string().min(1)).optional().default([]),
  })
  .refine((d) => d.type !== "SELECT" || d.options.length > 0, {
    message: "Tanlov turi uchun kamida bitta variant kerak",
    path: ["options"],
  });
export type ProductAttributeInput = z.infer<typeof productAttributeSchema>;

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
    isNew: z.coerce.boolean().default(false),
    discountPrice: z.coerce.number().positive("Chegirma narxi musbat bo'lishi kerak").optional().nullable(),
    discountEndsAt: z.string().optional().nullable(),
  })
  .refine((data) => Boolean(data.catalogProductId) !== Boolean(data.newCatalogProduct), {
    message: "Mavjud mahsulotni tanlang yoki yangisini yarating",
    path: ["catalogProductId"],
  })
  .refine((data) => !data.discountPrice || data.discountPrice < data.price, {
    message: "Chegirma narxi asosiy narxdan kichik bo'lishi kerak",
    path: ["discountPrice"],
  })
  .refine((data) => !data.discountPrice || Boolean(data.discountEndsAt), {
    message: "Chegirma tugash vaqtini kiriting",
    path: ["discountEndsAt"],
  });
export type ProductInput = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, "Nomi kiritilishi shart"),
  parentId: z.string().optional().nullable(),
  storeTypeId: z.string().min(1, "Do'kon turi tanlanishi shart"),
  imageUrl: z.string().optional().nullable(),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const storeTypeSchema = z.object({
  name: z.string().min(1, "Nomi kiritilishi shart"),
});
export type StoreTypeInput = z.infer<typeof storeTypeSchema>;

const baseAdminUserFields = {
  fullName: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  phone: phoneSchema,
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
};

export const createUserAsAdminSchema = z.discriminatedUnion("role", [
  z.object({ role: z.literal("CUSTOMER"), ...baseAdminUserFields }),
  z.object({ role: z.literal("SUPER_ADMIN"), ...baseAdminUserFields }),
  z.object({
    role: z.literal("OWNER"),
    ...baseAdminUserFields,
    storeName: z
      .string()
      .min(2, "Do'kon nomi kamida 2 ta belgidan iborat bo'lishi kerak")
      .regex(STORE_NAME_CHARS_REGEX, STORE_NAME_CHARS_HINT),
    storeTypeIds: z.array(z.string()).min(1, "Kamida bitta do'kon turi tanlanishi kerak"),
  }),
  z.object({
    role: z.literal("SELLER"),
    ...baseAdminUserFields,
    storeId: z.string().min(1, "Do'kon tanlanishi shart"),
  }),
]);
export type CreateUserAsAdminInput = z.infer<typeof createUserAsAdminSchema>;

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
  couponCode: z.string().trim().optional().nullable(),
});
export type SaleInput = z.infer<typeof saleSchema>;

export const COUPON_TYPES = ["PERCENT", "FIXED"] as const;
export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Kupon kodi kamida 3 ta belgidan iborat bo'lishi kerak")
      .max(20, "Kupon kodi 20 ta belgidan oshmasligi kerak")
      .regex(/^[A-Za-z0-9]+$/, "Kupon kodi faqat lotin harflari va raqamlardan iborat bo'lishi kerak"),
    type: z.enum(COUPON_TYPES),
    value: z.coerce.number().positive("Qiymat musbat bo'lishi kerak"),
    maxUses: z.coerce.number().int().positive("Butun musbat son bo'lishi kerak").optional().nullable(),
    expiresAt: z.string().optional().nullable(),
  })
  .refine((data) => data.type !== "PERCENT" || data.value <= 100, {
    message: "Foiz chegirma 100 dan oshmasligi kerak",
    path: ["value"],
  });
export type CouponInput = z.infer<typeof couponSchema>;

export const slugSchema = z
  .string()
  .min(3, "Subdomen kamida 3 ta belgidan iborat bo'lishi kerak")
  .max(40, "Subdomen 40 ta belgidan oshmasligi kerak")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Subdomen faqat kichik lotin harflari, raqam va tire (-) dan iborat bo'lishi mumkin");

const optionalUrl = z
  .string()
  .optional()
  .nullable()
  .refine((v) => !v || /^https?:\/\//i.test(v), "Havola https:// bilan boshlanishi kerak");

const optionalPhone = z
  .string()
  .optional()
  .nullable()
  .refine((v) => !v || /^\+998\d{9}$/.test(v), "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak");

/** Comes from a hidden input set by the browser's geolocation API — best-effort, never blocks saving the rest of the form. */
const optionalCoordinate = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === null || v === undefined || v === "") return null;
    const num = typeof v === "number" ? v : Number(v);
    return Number.isFinite(num) ? num : null;
  });

const optionalServicePolygon = z
  .array(z.object({ lat: z.number(), lng: z.number() }))
  .nullable()
  .optional()
  .transform((v) => (v && v.length >= 3 ? v : null));

export const updateStoreIdentitySchema = z.object({
  name: z.string().min(2, "Do'kon nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
  description: z.string().max(500, "Tavsif 500 ta belgidan oshmasligi kerak").optional().nullable(),
  slug: slugSchema,
  logoUrl: optionalUrl,
  bannerUrl: optionalUrl,
});
export type UpdateStoreIdentityInput = z.infer<typeof updateStoreIdentitySchema>;

export const updateStoreContactSchema = z.object({
  address: z.string().max(300, "Manzil 300 ta belgidan oshmasligi kerak").optional().nullable(),
  latitude: optionalCoordinate,
  longitude: optionalCoordinate,
  serviceRadiusKm: optionalCoordinate,
  servicePolygon: optionalServicePolygon,
  locationUrl: optionalUrl,
  workingHours: z.string().max(200, "Ish vaqti 200 ta belgidan oshmasligi kerak").optional().nullable(),
  contactPhone: optionalPhone,
  instagramUrl: optionalUrl,
  telegramUrl: optionalUrl,
});
export type UpdateStoreContactInput = z.infer<typeof updateStoreContactSchema>;

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Joriy parolni kiriting"),
  newPassword: z.string().min(6, "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak"),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const placeOrderSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Kamida bitta mahsulot tanlang"),
  address: z.string().min(3, "Manzil kiritilishi shart"),
  phone: phoneSchema,
  note: z.string().optional(),
});
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
