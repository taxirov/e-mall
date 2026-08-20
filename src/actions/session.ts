"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { registerStore, registerCustomer } from "./auth";

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

function dashboardPathFor(role?: string) {
  if (role === "SUPER_ADMIN") return "/dashboard/admin";
  if (role === "OWNER") return "/dashboard/owner";
  if (role === "SELLER") return "/dashboard/pos";
  return "/";
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
  redirect(callbackUrl || dashboardPathFor(user?.role));
}

async function signInWithCredentials(phone: string, password: string) {
  await signIn("credentials", { phone, password, redirect: false });
}

export async function registerStoreAction(_prevState: string | undefined, formData: FormData) {
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;

  const result = await registerStore({
    fullName: formData.get("fullName"),
    phone,
    password,
    storeName: formData.get("storeName"),
  });

  if (!result.ok) return result.error;

  await signInWithCredentials(phone, password);
  redirect("/dashboard/owner");
}

export async function registerCustomerAction(_prevState: string | undefined, formData: FormData) {
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;

  const result = await registerCustomer({
    fullName: formData.get("fullName"),
    phone,
    password,
  });

  if (!result.ok) return result.error;

  await signInWithCredentials(phone, password);
  const callbackUrl = formData.get("callbackUrl") as string | null;
  redirect(callbackUrl || "/");
}
