import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import { ROLE_VALUES } from "@/types";
import { requireRole, jsonError } from "@/lib/api";
import { logAction } from "@/lib/auditLogger";

export const runtime = "nodejs";

const patchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
  role: z.enum(ROLE_VALUES).optional(),
  isActive: z.boolean().optional(),
  companyName: z.string().max(160).optional().nullable(),
  brNumber: z.string().max(40).optional().nullable(),
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(["SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  await connectDB();
  const doc = await UserModel.findById(id).lean();
  if (!doc) return jsonError("Not found", 404);
  return NextResponse.json({
    id: String(doc._id), name: doc.name, email: doc.email, role: doc.role,
    isActive: doc.isActive, companyName: doc.companyName ?? null, brNumber: doc.brNumber ?? null,
    lastLoginAt: doc.lastLoginAt, createdAt: (doc as unknown as { createdAt: Date }).createdAt,
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(["SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return jsonError("Invalid payload", 422);

  if (id === guard.session.user.id && parsed.data.isActive === false) {
    return jsonError("You cannot deactivate yourself", 400);
  }

  await connectDB();
  const doc = await UserModel.findById(id);
  if (!doc) return jsonError("Not found", 404);

  /* Email is the sign-in identifier, so it must stay unique. Check up front to
     return a readable message instead of a raw duplicate-key error. */
  if (parsed.data.email) {
    const email = parsed.data.email.toLowerCase();
    const clash = await UserModel.findOne({ email, _id: { $ne: doc._id } })
      .select("_id")
      .lean();
    if (clash) return jsonError("That email is already used by another account", 409);
  }

  const before: Record<string, unknown> = {};
  for (const key of Object.keys(parsed.data) as (keyof typeof parsed.data)[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = (parsed.data as any)[key];
    if (val === undefined) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    before[key] = (doc as any)[key];
    if (key === "email" && typeof val === "string") {
      doc.email = val.toLowerCase();
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (doc as any)[key] = val;
    }
  }
  await doc.save();

  void logAction({
    userId: guard.session.user.id,
    userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "",
    userRole: guard.session.user.role,
    action: parsed.data.isActive === false ? "BLOCK_USER" : parsed.data.isActive === true ? "UNBLOCK_USER" : "UPDATE",
    entityType: "User",
    entityId: String(doc._id),
    description:
      parsed.data.email && before.email !== doc.email
        ? `Changed sign-in email ${String(before.email)} → ${doc.email}`
        : `Updated user ${doc.email}`,
    metadata: { before, after: parsed.data },
    request: req,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(["SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);
  if (id === guard.session.user.id) return jsonError("You cannot delete yourself", 400);

  await connectDB();
  // Soft delete = mark inactive
  const doc = await UserModel.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true }).lean();
  if (!doc) return jsonError("Not found", 404);

  void logAction({
    userId: guard.session.user.id,
    userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "",
    userRole: guard.session.user.role,
    action: "DELETE",
    entityType: "User",
    entityId: String(doc._id),
    description: `Soft-deleted user ${doc.email}`,
    request: req,
  });

  return NextResponse.json({ ok: true });
}
