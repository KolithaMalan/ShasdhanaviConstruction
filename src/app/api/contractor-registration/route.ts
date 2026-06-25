import { NextResponse } from "next/server";

import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { registrationSchema } from "@/lib/validators";
import { ContractorRegistrationModel } from "@/models/ContractorRegistration";
import { DocumentModel } from "@/models/Document";
import { notifyAdminNewRegistration } from "@/lib/email";
import { findBlacklistedNICs, findDuplicateEmployeeNICs } from "@/lib/employee";
import { getBaseUrl, jsonError } from "@/lib/api";
import { notifyRole } from "@/lib/notificationService";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON payload");
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid registration payload", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  await connectDB();

  /* ── Blacklist guard ─────────────────────────────────── */
  const nics = parsed.data.labourList.map((l) => l.nicNumber);
  const blocked = await findBlacklistedNICs(nics);
  if (blocked.length > 0) {
    return NextResponse.json(
      {
        message:
          "The following NIC numbers are blacklisted and cannot be registered: " +
          blocked.join(", ") +
          ". Please remove them and resubmit.",
        blacklistedNics: blocked,
      },
      { status: 400 },
    );
  }

  /* ── Duplicate-employee guard ────────────────────────── */
  const duplicates = await findDuplicateEmployeeNICs(nics);
  if (duplicates.length > 0) {
    return NextResponse.json(
      {
        message:
          "The following NIC numbers are already registered with another contractor: " +
          duplicates.map((d) => `${d.nicNumber} (${d.companyName})`).join(", ") +
          ". Please remove them and resubmit.",
        duplicateNics: duplicates,
      },
      { status: 400 },
    );
  }

  /* ── Document existence check ───────────────────────── */
  const safetyId = parsed.data.safetyPlanDocId;
  const cmdId = parsed.data.cmdDocId ?? null;
  const safetyDoc = await DocumentModel.findById(safetyId).select("_id kind");
  if (!safetyDoc || safetyDoc.kind !== "SAFETY_PLAN") {
    return jsonError("Safety Plan upload could not be found — please re-upload", 400);
  }
  if (cmdId) {
    const cmdDoc = await DocumentModel.findById(cmdId).select("_id kind");
    if (!cmdDoc || cmdDoc.kind !== "CMD") {
      return jsonError("CMD upload could not be found — please re-upload", 400);
    }
  }

  const doc = await ContractorRegistrationModel.create({
    ...parsed.data,
    hasSafetyPlan: true,
    hasContractorManagementDocs: !!cmdId,
    safetyPlanDocId: new mongoose.Types.ObjectId(safetyId),
    cmdDocId: cmdId ? new mongoose.Types.ObjectId(cmdId) : null,
    status: "PENDING",
    submittedAt: new Date(),
  });

  /* Link uploaded documents back to the registration. */
  await DocumentModel.updateMany(
    { _id: { $in: [safetyId, cmdId].filter(Boolean) } },
    { $set: { registrationId: doc._id } },
  );

  void notifyAdminNewRegistration({
    registrationId: String(doc._id),
    companyName: doc.companyName,
    email: doc.email,
    scopeOfWork: doc.scopeOfWork,
    labourCount: doc.labourList.length,
    vehicleCount: doc.vehicles.length,
    electricalEquipmentCount: doc.electricalEquipment.length,
    nonElectricalToolsCount: doc.nonElectricalTools.length,
    baseUrl: getBaseUrl(req),
  });

  /* Phase 6 — in-app notifications to all admins */
  void notifyRole(["ADMIN_HSEQ", "SUPER_ADMIN"], {
    type: "REGISTRATION_SUBMITTED",
    title: "New contractor registration",
    message: `${doc.companyName} (${doc.email}) submitted a registration awaiting review.`,
    link: `/admin/registrations/${String(doc._id)}`,
  });

  return NextResponse.json({ ok: true, id: String(doc._id) }, { status: 201 });
}
