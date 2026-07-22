import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { ContractorRegistrationModel } from "@/models/ContractorRegistration";
import { requireRole, jsonError } from "@/lib/api";
import { requireFeature } from "@/lib/featureService";
import { logAction } from "@/lib/auditLogger";

export const runtime = "nodejs";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(["SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  const blocked = await requireFeature(guard.session.user.role, "action:registration.approve");
  if (blocked) return blocked;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  await connectDB();
  const doc = await ContractorRegistrationModel.findById(id);
  if (!doc) return jsonError("Not found", 404);

  doc.status = "APPROVED";
  doc.reviewedAt = new Date();
  doc.reviewedBy = new mongoose.Types.ObjectId(guard.session.user.id);
  await doc.save();

  void logAction({
    userId: guard.session.user.id,
    userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "",
    userRole: guard.session.user.role,
    action: "APPROVE",
    entityType: "ContractorRegistration",
    entityId: String(doc._id),
    description: `Approved registration for ${doc.companyName} (${doc.email})`,
    request: req,
  });

  return NextResponse.json({ ok: true });
}
