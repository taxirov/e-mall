import { auth } from "@/auth";

export class AuthzError extends Error {}

export async function requireRole(roles: Array<"SUPER_ADMIN" | "OWNER" | "SELLER" | "CUSTOMER">) {
  const session = await auth();
  if (!session?.user) throw new AuthzError("Tizimga kirish talab qilinadi");
  if (!roles.includes(session.user.role as (typeof roles)[number])) {
    throw new AuthzError("Ushbu amal uchun ruxsatingiz yo'q");
  }
  return session;
}

/** OWNER/SELLER actions must be scoped to their own store. */
export async function requireStoreMember() {
  const session = await requireRole(["OWNER", "SELLER"]);
  if (!session.user.storeId) throw new AuthzError("Do'kon topilmadi");
  return { session, storeId: session.user.storeId };
}
