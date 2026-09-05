"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rootOrigin } from "@/lib/domain";
import { registerStore, registerCustomer, type ActionResult } from "./auth";

export async function signOutAction() {
  // Belt-and-suspenders cleanup of the pre-rename cookie names (see
  // auth.config.ts for why the active cookie is now "...-v2") — harmless
  // for anyone who never had them, tidies up for anyone who still does.
  const cookieStore = await cookies();
  cookieStore.delete("authjs.session-token");
  cookieStore.delete("__Secure-authjs.session-token");
  await signOut({ redirectTo: "/login" });
}

/**
 * app.e-mall.uz has no landing page of its own (middleware bounces bare "/"
 * back to /login there), so a CUSTOMER with no callbackUrl is sent to the
 * root marketing site's store directory instead of into that dead end.
 */
async function dashboardPathFor(role?: string) {
  if (role === "SUPER_ADMIN") return "/dashboard/admin";
  if (role === "OWNER") return "/dashboard/owner";
  if (role === "SELLER") return "/dashboard/pos";
  const host = (await headers()).get("host") ?? "";
  return `${rootOrigin(host)}/`;
}

export async function authenticate(_prevState: string | undefined, formData: FormData) {
  const phone = formData.get("phone") as string;

  try {
    await signIn("credentials", {
      phone,
      password: formData.get("password"),
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Telefon raqam yoki parol noto'g'ri";
    }
    throw error;
  }

  // Looked up directly (rather than via auth()) since the session cookie
  // set by signIn() above isn't guaranteed to be visible yet within the
  // same server action invocation.
  const user = await prisma.user.findUnique({ where: { phone }, select: { role: true } });
  const callbackUrl = formData.get("callbackUrl") as string | null;
  redirect(callbackUrl || (await dashboardPathFor(user?.role)));
}

/**
 * Passwordless login via a Telegram-issued 6-digit code. The role (for
 * redirect) is read non-destructively before signIn() actually consumes the
 * code through the Credentials provider's authorize() — avoids relying on
 * the session cookie being visible immediately after signIn() resolves.
 */
export async function authenticateWithTelegramCode(code: string): Promise<ActionResult<{ redirectTo: string }>> {
  const record = await prisma.telegramVerification.findUnique({ where: { code: code.trim() } });
  if (!record || record.type !== "LOGIN" || !record.userId || record.expiresAt < new Date()) {
    return { ok: false, error: "Kod noto'g'ri yoki muddati o'tgan" };
  }
  const user = await prisma.user.findUnique({ where: { id: record.userId }, select: { role: true } });

  try {
    await signIn("credentials", { telegramCode: code, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Kod noto'g'ri yoki muddati o'tgan" };
    }
    throw error;
  }

  return { ok: true, data: { redirectTo: await dashboardPathFor(user?.role) } };
}

async function signInWithCredentials(phone: string, password: string) {
  await signIn("credentials", { phone, password, redirect: false });
}

export async function completeStoreRegistration(input: {
  fullName: string;
  phone: string;
  password: string;
  storeName: string;
  storeTypeIds: string[];
  telegramChatId: string;
  telegramPhone: string | null;
}) {
  const result = await registerStore(input);
  if (!result.ok) return result.error;

  await signInWithCredentials(input.phone, input.password);
  redirect("/dashboard/owner");
}

export async function completeCustomerRegistration(
  input: {
    fullName: string;
    phone: string;
    password: string;
    telegramChatId: string;
    telegramPhone: string | null;
  },
  callbackUrl?: string
) {
  const result = await registerCustomer(input);
  if (!result.ok) return result.error;

  await signInWithCredentials(input.phone, input.password);
  const host = (await headers()).get("host") ?? "";
  redirect(callbackUrl || `${rootOrigin(host)}/`);
}
