import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { markAllAsRead } from "@/lib/notificationService";
import { requireSession } from "@/lib/api";

export const runtime = "nodejs";

export async function PATCH() {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  await connectDB();
  const updated = await markAllAsRead(guard.session.user.id);
  return NextResponse.json({ ok: true, updated });
}
