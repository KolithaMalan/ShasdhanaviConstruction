import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { AdditionalRequestModel } from "@/models/AdditionalRequest";
import { requireRole } from "@/lib/api";
import { ADDITIONAL_REQUEST_STATUSES, ADDITIONAL_REQUEST_TYPES } from "@/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");

  const filter: Record<string, unknown> = {};
  if (status && ADDITIONAL_REQUEST_STATUSES.includes(status as never)) filter.status = status;
  if (type && ADDITIONAL_REQUEST_TYPES.includes(type as never)) filter.requestType = type;

  const docs = await AdditionalRequestModel.find(filter)
    .sort({ submittedAt: -1 })
    .lean();

  return NextResponse.json({
    items: docs.map((d) => ({
      id: String(d._id),
      contractorId: String(d.contractorId),
      companyName: d.companyName,
      requestType: d.requestType,
      itemCount:
        (d.labourList?.length ?? 0) +
        (d.vehicles?.length ?? 0) +
        (d.electricalEquipment?.length ?? 0) +
        (d.nonElectricalTools?.length ?? 0),
      status: d.status,
      submittedAt: d.submittedAt,
    })),
  });
}
