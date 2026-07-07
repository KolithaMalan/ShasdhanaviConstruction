import { NextResponse } from "next/server";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import { notifyRole } from "@/lib/notificationService";
import { requireRole, jsonError } from "@/lib/api";
import { logAction } from "@/lib/auditLogger";
import { ROLE_VALUES } from "@/types";

export const runtime = "nodejs";

const bodySchema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(120),
  message: z.string().trim().min(5, "Message is too short").max(1000),
  link: z.string().trim().max(300).optional().default(""),
  // Empty array = broadcast to every role.
  roles: z.array(z.enum(ROLE_VALUES)).default([]),
});

export async function POST(req: Request) {
  const guard = await requireRole(["SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 422 },
    );
  }

  const { title, message, link, roles } = parsed.data;
  const targetRoles = roles.length > 0 ? roles : [...ROLE_VALUES];

  await connectDB();

  const recipientCount = await UserModel.countDocuments({
    role: { $in: targetRoles },
    isActive: true,
  });

  if (recipientCount === 0) {
    return jsonError("No active users match the selected roles.", 400);
  }

  await notifyRole(targetRoles, {
    type: "SYSTEM_ALERT",
    title,
    message,
    link,
  });

  void logAction({
    userId: guard.session.user.id,
    userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "",
    userRole: guard.session.user.role,
    action: "CREATE",
    entityType: "Announcement",
    description: `Broadcast "${title}" to ${recipientCount} user(s)`,
    metadata: { title, roles: targetRoles, recipientCount },
    request: req,
  });

  return NextResponse.json({ ok: true, recipientCount });
}
