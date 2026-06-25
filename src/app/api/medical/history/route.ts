import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["MEDICAL_OFFICER", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // PASSED | FAILED
  const q = searchParams.get("q")?.trim();

  await connectDB();
  const filter: Record<string, unknown> = {
    medicalStatus: { $in: ["PASSED", "FAILED"] },
  };
  if (status === "PASSED" || status === "FAILED") filter.medicalStatus = status;
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { nicNumber: { $regex: q.toUpperCase(), $options: "i" } },
    ];
  }

  const docs = await EmployeeModel.find(filter)
    .sort({ medicalScreenedAt: -1 })
    .limit(500)
    .populate("medicalScreenedBy", "name")
    .lean();

  return NextResponse.json({
    items: docs.map((d) => ({
      id: String(d._id),
      name: d.name,
      nicNumber: d.nicNumber,
      contractor: d.companyName,
      trade: d.tradeType,
      medicalStatus: d.medicalStatus,
      medicalDocumentId: d.medicalDocumentId,
      bloodType: d.bloodType,
      medicalRejectionReason: d.medicalRejectionReason,
      screenedAt: d.medicalScreenedAt,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      screenedBy: (d.medicalScreenedBy as any)?.name ?? "—",
    })),
  });
}
