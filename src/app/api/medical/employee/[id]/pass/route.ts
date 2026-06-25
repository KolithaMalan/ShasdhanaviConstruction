import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { requireRole, jsonError } from "@/lib/api";
import { logAction } from "@/lib/auditLogger";
import { createNotification } from "@/lib/notificationService";
import { BLOOD_TYPES } from "@/types";

export const runtime = "nodejs";

const bodySchema = z.object({
  medicalDocumentId: z.string().max(80).optional().default(""),
  bloodType: z.enum(BLOOD_TYPES).optional().default("Unknown"),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(["MEDICAL_OFFICER", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return jsonError("Invalid payload", 422);

  await connectDB();
  const doc = await EmployeeModel.findById(id);
  if (!doc) return jsonError("Not found", 404);
  if (doc.status !== "PENDING_MEDICAL") {
    return jsonError("Employee is not pending medical", 409);
  }

  doc.status = "MEDICAL_PASSED";
  doc.medicalStatus = "PASSED";
  doc.medicalDocumentId = parsed.data.medicalDocumentId;
  doc.bloodType = parsed.data.bloodType;
  doc.medicalScreenedAt = new Date();
  doc.medicalScreenedBy = new mongoose.Types.ObjectId(guard.session.user.id);
  await doc.save();

  void logAction({
    userId: guard.session.user.id,
    userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "",
    userRole: guard.session.user.role,
    action: "MEDICAL_PASS",
    entityType: "Employee",
    entityId: String(doc._id),
    description: `Medical PASSED · ${doc.name} (${doc.nicNumber})`,
    request: req,
  });

  void createNotification({
    userId: doc.contractorId,
    type: "MEDICAL_PASSED",
    title: "Employee passed medical",
    message: `${doc.name} (${doc.nicNumber}) passed medical screening and is now awaiting induction.`,
    link: "/contractor/employees",
  });

  return NextResponse.json({ ok: true });
}
