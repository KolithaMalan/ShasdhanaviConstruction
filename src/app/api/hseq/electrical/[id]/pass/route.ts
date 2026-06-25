import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { ElectricalEquipmentModel } from "@/models/ElectricalEquipment";
import { computeNextInspectionDue } from "@/lib/tools";
import { requireRole, jsonError } from "@/lib/api";
import { logAction } from "@/lib/auditLogger";
import { createNotification } from "@/lib/notificationService";

export const runtime = "nodejs";

const bodySchema = z.object({
  inspectionNotes: z.string().max(2000).optional().default(""),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(["HSEQ_OFFICER", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return jsonError("Invalid payload", 422);

  await connectDB();
  const doc = await ElectricalEquipmentModel.findById(id);
  if (!doc) return jsonError("Not found", 404);
  if (doc.inspectionStatus !== "PENDING_INSPECTION") {
    return jsonError("Equipment is not pending inspection", 409);
  }

  const now = new Date();
  doc.inspectionStatus = "PASSED";
  doc.status = "APPROVED_INVENTORY";
  doc.inspectedAt = now;
  doc.inspectedBy = new mongoose.Types.ObjectId(guard.session.user.id);
  doc.inspectorName = guard.session.user.name ?? "HSEQ Officer";
  doc.inspectionNotes = parsed.data.inspectionNotes;
  doc.nextInspectionDue = computeNextInspectionDue(now);
  await doc.save();

  void logAction({
    userId: guard.session.user.id, userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "", userRole: guard.session.user.role,
    action: "INSPECTION_PASS", entityType: "ElectricalEquipment",
    entityId: String(doc._id), description: `Passed inspection · ${doc.toolName} (${doc.equipmentId})`,
    request: req,
  });

  void createNotification({
    userId: doc.contractorId,
    type: "EQUIPMENT_INSPECTION_PASSED",
    title: "Electrical equipment cleared",
    message: `${doc.toolName} (${doc.equipmentId}) passed inspection — valid for 6 months.`,
    link: "/contractor/equipment",
  });

  return NextResponse.json({ ok: true, equipmentId: doc.equipmentId });
}
