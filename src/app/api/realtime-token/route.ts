import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createRealtimeToken } from "@/lib/realtime";

export async function GET() {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = createRealtimeToken({
    storeId: session.user.storeId,
    userId: session.user.id,
    role: session.user.role,
  });

  return NextResponse.json({ token });
}
