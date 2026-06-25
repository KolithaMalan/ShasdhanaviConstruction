import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { markAsRead } from "@/lib/notificationService";
import { requireSession, jsonError } from "@/lib/api";

export const runtime = "nodejs";

export async function PATCH(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;
  const { id } = await ctx.params;

  await connectDB();
  const result = await markAsRead(id, guard.session.user.id);
  if (!result.ok) return jsonError("Invalid notification id", 400);
  return NextResponse.json({ ok: true });
}
