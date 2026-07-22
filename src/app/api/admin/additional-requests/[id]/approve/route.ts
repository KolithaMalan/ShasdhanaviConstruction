import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { AdditionalRequestModel } from "@/models/AdditionalRequest";
import { UserModel } from "@/models/User";
import { ContractorRegistrationModel } from "@/models/ContractorRegistration";
import { notifyAdditionalRequestApproved } from "@/lib/email";
import { bulkCreateEmployees } from "@/lib/employee";
import { bulkCreateVehicles } from "@/lib/vehicle";
import {
  bulkCreateElectricalEquipment,
  bulkCreateNonElectricalTools,
} from "@/lib/tools";
import { requireRole, jsonError, getBaseUrl } from "@/lib/api";
import { requireFeature } from "@/lib/featureService";

export const runtime = "nodejs";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(["SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  const blocked = await requireFeature(guard.session.user.role, "action:registration.approve");
  if (blocked) return blocked;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  await connectDB();
  const doc = await AdditionalRequestModel.findById(id);
  if (!doc) return jsonError("Not found", 404);

  doc.status = "APPROVED";
  doc.reviewedAt = new Date();
  doc.reviewedBy = new mongoose.Types.ObjectId(guard.session.user.id);
  await doc.save();

  const contractor = await UserModel.findById(doc.contractorId);
  if (contractor?.registrationId) {
    await ContractorRegistrationModel.updateOne(
      { _id: contractor.registrationId },
      {
        $push: {
          labourList: { $each: doc.labourList ?? [] },
          vehicles: { $each: doc.vehicles ?? [] },
          electricalEquipment: { $each: doc.electricalEquipment ?? [] },
          nonElectricalTools: { $each: doc.nonElectricalTools ?? [] },
        },
      },
    );
  }

  /* ── Phase 3 — auto-create Employee records for LABOUR additions ── */
  let employeeOutcome: Awaited<ReturnType<typeof bulkCreateEmployees>> | null = null;
  if (doc.requestType === "LABOUR" && doc.labourList.length > 0 && contractor) {
    employeeOutcome = await bulkCreateEmployees(
      String(contractor._id),
      contractor.companyName ?? contractor.name,
      doc.labourList.map((l) => ({
        name: l.name,
        nicNumber: l.nicNumber,
        address: l.address,
        mobileNumber: l.mobileNumber,
        emergencyContact: l.emergencyContact,
        tradeType: l.tradeType,
        designation: l.designation,
        joinedDate: l.joinedDate,
      })),
    );
  }

  /* ── Phase 4 — auto-create Vehicle records for VEHICLE additions ── */
  let vehicleOutcome: Awaited<ReturnType<typeof bulkCreateVehicles>> | null = null;
  if (doc.requestType === "VEHICLE" && doc.vehicles.length > 0 && contractor) {
    vehicleOutcome = await bulkCreateVehicles(
      String(contractor._id),
      contractor.companyName ?? contractor.name,
      doc.vehicles.map((v) => ({
        vehicleNumber: v.vehicleNumber,
        vehicleType: v.vehicleType,
        vehicleColour: v.vehicleColour,
        vehiclePurpose: v.vehiclePurpose,
        vehicleMaterials: v.vehicleMaterials,
      })),
    );
  }

  /* ── Phase 5 — auto-create electrical / non-electrical tool records ── */
  let electricalOutcome: Awaited<ReturnType<typeof bulkCreateElectricalEquipment>> | null = null;
  if (
    doc.requestType === "ELECTRICAL_EQUIPMENT" &&
    doc.electricalEquipment.length > 0 &&
    contractor
  ) {
    electricalOutcome = await bulkCreateElectricalEquipment(
      String(contractor._id),
      contractor.companyName ?? contractor.name,
      doc.electricalEquipment.map((e) => ({
        toolName: e.toolName,
        category: e.category,
        quantity: e.quantity,
        serialNumber: e.serialNumber,
        powerDetails: e.powerDetails,
      })),
    );
  }

  let nonElectricalOutcome: Awaited<ReturnType<typeof bulkCreateNonElectricalTools>> | null = null;
  if (
    doc.requestType === "NON_ELECTRICAL_TOOLS" &&
    doc.nonElectricalTools.length > 0 &&
    contractor
  ) {
    nonElectricalOutcome = await bulkCreateNonElectricalTools(
      String(contractor._id),
      contractor.companyName ?? contractor.name,
      doc.nonElectricalTools.map((t) => ({
        toolName: t.toolName,
        category: t.category,
        quantity: t.quantity,
        unit: t.unit,
      })),
    );
  }

  if (contractor?.email) {
    const followUp =
      doc.requestType === "ELECTRICAL_EQUIPMENT"
        ? "New electrical items require HSEQ electrical inspection before site use."
        : doc.requestType === "NON_ELECTRICAL_TOOLS"
          ? "New tools are now in your inventory and available for gate-pass movements."
          : doc.requestType === "LABOUR"
            ? "New employees will appear in your console once medical screening and induction are complete."
            : doc.requestType === "VEHICLE"
              ? "New vehicles have been added to your fleet and a QR will be issued."
              : undefined;
    const itemCount =
      (doc.labourList?.length ?? 0) +
      (doc.vehicles?.length ?? 0) +
      (doc.electricalEquipment?.length ?? 0) +
      (doc.nonElectricalTools?.length ?? 0);
    void notifyAdditionalRequestApproved({
      to: contractor.email,
      companyName: contractor.companyName ?? contractor.name,
      requestType: doc.requestType,
      itemCount,
      followUp,
      loginUrl: `${getBaseUrl(req)}/contractor`,
    });
  }

  return NextResponse.json({
    ok: true,
    employees: employeeOutcome,
    vehicles: vehicleOutcome,
    electricalEquipment: electricalOutcome,
    nonElectricalTools: nonElectricalOutcome,
  });
}
