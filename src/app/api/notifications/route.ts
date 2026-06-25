import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { NotificationModel } from "@/models/Notification";
import { requireSession } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const readParam = searchParams.get("read");
  const type = searchParams.get("type");

  const filter: Record<string, unknown> = { userId: guard.session.user.id };
  if (readParam === "true") filter.read = true;
  if (readParam === "false") filter.read = false;
  if (type) filter.type = type;

  await connectDB();
  const [items, total] = await Promise.all([
    NotificationModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    NotificationModel.countDocuments(filter),
  ]);

  return NextResponse.json({
    items: items.map((n) => ({
      id: String(n._id),
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link,
      read: n.read,
      readAt: n.readAt,
      createdAt: (n as unknown as { createdAt: Date }).createdAt,
    })),
    total,
    page,
    limit,
  });
}
