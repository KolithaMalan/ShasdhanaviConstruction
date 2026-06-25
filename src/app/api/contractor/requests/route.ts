import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { AdditionalRequestModel } from "@/models/AdditionalRequest";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireRole(["CONTRACTOR"]);
  if (!guard.ok) return guard.response;

  await connectDB();
  const docs = await AdditionalRequestModel.find({ contractorId: guard.session.user.id })
    .sort({ submittedAt: -1 })
    .lean();

  return NextResponse.json({
    items: docs.map((d) => ({
      id: String(d._id),
      requestType: d.requestType,
      itemCount:
        (d.labourList?.length ?? 0) +
        (d.vehicles?.length ?? 0) +
        (d.electricalEquipment?.length ?? 0) +
        (d.nonElectricalTools?.length ?? 0),
      status: d.status,
      adminNotes: d.adminNotes,
      submittedAt: d.submittedAt,
      reviewedAt: d.reviewedAt,
    })),
  });
}
