import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    storeId?: string | null;
    phone?: string;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      storeId: string | null;
      phone: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    storeId?: string | null;
    phone?: string;
  }
}
