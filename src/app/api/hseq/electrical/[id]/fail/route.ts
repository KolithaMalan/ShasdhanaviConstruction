import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { ElectricalEquipmentModel } from "@/models/ElectricalEquipment";
import { requireRole, jsonError } from "@/lib/api";

export const runtime = "nodejs";

const bodySchema = z.object({
  reason: z.string().min(3, "Failure reason is required").max(2000),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(["HSEQ_OFFICER", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return jsonError("Reason is required", 422);

  await connectDB();
  const doc = await ElectricalEquipmentModel.findById(id);
  if (!doc) return jsonError("Not found", 404);
  if (doc.inspectionStatus !== "PENDING_INSPECTION") {
    return jsonError("Equipment is not pending inspection", 409);
  }

  doc.inspectionStatus = "FAILED";
  doc.status = "BLOCKED";
  doc.failureReason = parsed.data.reason;
  doc.inspectedAt = new Date();
  doc.inspectedBy = new mongoose.Types.ObjectId(guard.session.user.id);
  doc.inspectorName = guard.session.user.name ?? "HSEQ Officer";
  await doc.save();

  return NextResponse.json({ ok: true });
}
