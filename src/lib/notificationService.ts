import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { NotificationModel } from "@/models/Notification";
import { UserModel } from "@/models/User";
import type { NotificationType, Role } from "@/types";

interface CreateInput {
  userId: string | mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: unknown;
}

export async function createNotification(input: CreateInput): Promise<void> {
  try {
    await connectDB();
    await NotificationModel.create({
      userId: new mongoose.Types.ObjectId(String(input.userId)),
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link ?? "",
      metadata: input.metadata ?? null,
      read: false,
    });
  } catch (err) {
    console.warn("[notify] create failed:", err instanceof Error ? err.message : err);
  }
}

/** Fan-out to every user of the given role(s). */
export async function notifyRole(
  roles: Role[],
  payload: Omit<CreateInput, "userId">,
): Promise<void> {
  try {
    await connectDB();
    const users = await UserModel.find({ role: { $in: roles }, isActive: true })
      .select("_id")
      .lean();
    if (users.length === 0) return;
    await NotificationModel.insertMany(
      users.map((u) => ({
        userId: u._id,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        link: payload.link ?? "",
        metadata: payload.metadata ?? null,
        read: false,
      })),
    );
  } catch (err) {
    console.warn("[notify] fan-out failed:", err instanceof Error ? err.message : err);
  }
}

export async function markAsRead(
  notificationId: string,
  userId: string,
): Promise<{ ok: boolean }> {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) return { ok: false };
  await NotificationModel.updateOne(
    { _id: notificationId, userId },
    { $set: { read: true, readAt: new Date() } },
  );
  return { ok: true };
}

export async function markAllAsRead(userId: string): Promise<number> {
  const res = await NotificationModel.updateMany(
    { userId, read: false },
    { $set: { read: true, readAt: new Date() } },
  );
  return res.modifiedCount ?? 0;
}

export async function getUnreadCount(userId: string): Promise<number> {
  return NotificationModel.countDocuments({ userId, read: false });
}
