import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { AdditionalRequestModel } from "@/models/AdditionalRequest";
import { UserModel } from "@/models/User";
import { additionalRequestSchema } from "@/lib/validators";
import { notifyAdminAdditionalRequest } from "@/lib/email";
import { findBlacklistedNICs, findDuplicateEmployeeNICs } from "@/lib/employee";
import { requireRole, getBaseUrl, jsonError } from "@/lib/api";
import { requireFeature } from "@/lib/featureService";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const guard = await requireRole(["CONTRACTOR"]);
  if (!guard.ok) return guard.response;

  const blocked = await requireFeature(guard.session.user.role, "action:contractor.request");
  if (blocked) return blocked;

  const body = await req.json().catch(() => null);
  const parsed = additionalRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid payload", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  await connectDB();

  /* ── Blacklist + duplicate guards for LABOUR submissions ─── */
  if (parsed.data.requestType === "LABOUR" && parsed.data.labourList.length > 0) {
    const nics = parsed.data.labourList.map((l) => l.nicNumber);
    const blocked = await findBlacklistedNICs(nics);
    if (blocked.length > 0) {
      return NextResponse.json(
        {
          message:
            "The following NIC numbers are blacklisted and cannot be added: " +
            blocked.join(", ") +
            ".",
          blacklistedNics: blocked,
        },
        { status: 400 },
      );
    }
    const duplicates = await findDuplicateEmployeeNICs(nics);
    if (duplicates.length > 0) {
      return NextResponse.json(
        {
          message:
            "The following NIC numbers are already registered and cannot be added again: " +
            duplicates.map((d) => `${d.nicNumber} (${d.companyName})`).join(", ") +
            ".",
          duplicateNics: duplicates,
        },
        { status: 400 },
      );
    }
  }

  const user = await UserModel.findById(guard.session.user.id).lean();
  if (!user) return jsonError("User not found", 404);

  const doc = await AdditionalRequestModel.create({
    contractorId: user._id,
    companyName: user.companyName ?? user.name,
    requestType: parsed.data.requestType,
    labourList: parsed.data.labourList,
    vehicles: parsed.data.vehicles,
    electricalEquipment: parsed.data.electricalEquipment,
    nonElectricalTools: parsed.data.nonElectricalTools,
    status: "PENDING",
    submittedAt: new Date(),
  });

  const itemCount =
    parsed.data.labourList.length +
    parsed.data.vehicles.length +
    parsed.data.electricalEquipment.length +
    parsed.data.nonElectricalTools.length;

  void notifyAdminAdditionalRequest({
    contractorName: user.companyName ?? user.name,
    requestType: parsed.data.requestType,
    itemCount,
    requestId: String(doc._id),
    baseUrl: getBaseUrl(req),
  });

  return NextResponse.json({ ok: true, id: String(doc._id) }, { status: 201 });
}
