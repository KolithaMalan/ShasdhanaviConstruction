import mongoose from "mongoose";

import { AuditLogModel } from "@/models/AuditLog";
import { connectDB } from "@/lib/db";
import type { AuditAction } from "@/types";

interface LogInput {
  userId: string | mongoose.Types.ObjectId;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  description?: string;
  metadata?: unknown;
  request?: Request | null;
}

/**
 * Fire-and-forget audit log writer. Callers should use `void logAction(...)`.
 * Errors are swallowed so audit failures never block business actions.
 */
export async function logAction(input: LogInput): Promise<void> {
  try {
    await connectDB();
    const headers = input.request?.headers;
    const ip =
      headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headers?.get("x-real-ip") ||
      "";
    const ua = headers?.get("user-agent") ?? "";

    await AuditLogModel.create({
      userId: new mongoose.Types.ObjectId(String(input.userId)),
      userName: input.userName ?? "",
      userEmail: input.userEmail ?? "",
      userRole: input.userRole ?? "",
      action: input.action,
      entityType: input.entityType ?? "",
      entityId: input.entityId ?? "",
      description: input.description ?? "",
      metadata: input.metadata ?? null,
      ipAddress: ip,
      userAgent: ua,
    });
  } catch (err) {
    console.warn("[audit] failed to log action:", err instanceof Error ? err.message : err);
  }
}
