import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { generateEmployeeId, computeIdCardExpiry } from "@/lib/employee";
import { makeQrPayload } from "@/lib/qr";
import { requireRole, jsonError } from "@/lib/api";
import { logAction } from "@/lib/auditLogger";
import { createNotification } from "@/lib/notificationService";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(["HSEQ_OFFICER", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  await connectDB();
  const doc = await EmployeeModel.findById(id);
  if (!doc) return jsonError("Not found", 404);
  if (doc.status !== "MEDICAL_PASSED") {
    return jsonError("Employee is not awaiting induction", 409);
  }
  if (!doc.photoUrl) {
    return jsonError("Photo must be captured before completing induction", 400);
  }

  /* Ensure unique employeeId */
  let empId = generateEmployeeId();
  for (let i = 0; i < 5; i += 1) {
    const exists = await EmployeeModel.exists({ employeeId: empId });
    if (!exists) break;
    empId = generateEmployeeId();
  }

  const issuedAt = new Date();
  doc.employeeId = empId;
  doc.qrCodeData = makeQrPayload({
    eid: empId,
    nic: doc.nicNumber,
    cid: String(doc.contractorId),
  });
  doc.inductionCompletedAt = issuedAt;
  doc.inductionCompletedBy = new mongoose.Types.ObjectId(guard.session.user.id);
  doc.idCardIssuedAt = issuedAt;
  doc.idCardExpiresAt = computeIdCardExpiry(issuedAt);
  doc.status = "ACTIVE";

  await doc.save();

  void logAction({
    userId: guard.session.user.id,
    userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "",
    userRole: guard.session.user.role,
    action: "CREATE",
    entityType: "IdCard",
    entityId: empId,
    description: `Induction complete · ${doc.name} · ID ${empId}`,
    request: req,
  });

  void createNotification({
    userId: doc.contractorId,
    type: "INDUCTION_COMPLETED",
    title: "Employee is ACTIVE",
    message: `${doc.name} (${empId}) is fully inducted and cleared for site access.`,
    link: "/contractor/employees",
  });

  return NextResponse.json({ ok: true, employeeId: empId });
}
