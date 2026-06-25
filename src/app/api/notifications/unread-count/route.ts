import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { getUnreadCount } from "@/lib/notificationService";
import { requireSession } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  await connectDB();
  const count = await getUnreadCount(guard.session.user.id);
  return NextResponse.json({ count });
}
