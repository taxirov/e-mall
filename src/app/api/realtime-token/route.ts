import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createRealtimeToken, ADMIN_ROOM, storeRoom } from "@/lib/realtime";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const room = session.user.role === "SUPER_ADMIN" ? ADMIN_ROOM : session.user.storeId ? storeRoom(session.user.storeId) : null;
  if (!room) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = createRealtimeToken({ room, userId: session.user.id, role: session.user.role });

  return NextResponse.json({ token });
}
