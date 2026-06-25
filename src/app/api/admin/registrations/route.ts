import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { ContractorRegistrationModel } from "@/models/ContractorRegistration";
import { requireRole } from "@/lib/api";
import { REGISTRATION_STATUSES } from "@/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  await connectDB();

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const q = searchParams.get("q")?.trim().toLowerCase();

  const filter: Record<string, unknown> = {};
  if (statusParam && REGISTRATION_STATUSES.includes(statusParam as never)) {
    filter.status = statusParam;
  }
  if (q) {
    filter.$or = [
      { companyName: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  }

  const docs = await ContractorRegistrationModel.find(filter)
    .sort({ submittedAt: -1 })
    .lean();

  return NextResponse.json({
    items: docs.map((d) => ({
      id: String(d._id),
      companyName: d.companyName,
      email: d.email,
      scopeOfWork: d.scopeOfWork,
      labourCount: d.labourList.length,
      vehicleCount: d.vehicles.length,
      electricalEquipmentCount: d.electricalEquipment.length,
      nonElectricalToolsCount: d.nonElectricalTools.length,
      status: d.status,
      submittedAt: d.submittedAt,
      contractorAccountCreated: d.contractorAccountCreated,
    })),
  });
}
