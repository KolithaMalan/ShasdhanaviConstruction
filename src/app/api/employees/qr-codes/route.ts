import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { requireRole } from "@/lib/api";
import { DOWNLOAD_ROLES, scopedEmployeeFilter } from "@/lib/employeeAccess";

export const runtime = "nodejs";

/**
 * GET /api/employees/qr-codes?contractor=&nic=
 *
 * Returns ACTIVE + INDUCTION_COMPLETED employees with QR codes.
 *
 * Scope rules:
 *   SUPER_ADMIN / ADMIN_HSEQ / HSEQ_OFFICER → all employees, may filter by contractor
 *   CONTRACTOR                              → only their own employees;
 *                                             contractor filter is ignored.
 */
export async function GET(req: Request) {
  const guard = await requireRole(DOWNLOAD_ROLES);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const contractor = searchParams.get("contractor")?.trim() ?? "";
  const nic = searchParams.get("nic")?.trim().toUpperCase() ?? "";

  await connectDB();

  const base: Record<string, unknown> = {
    qrCodeData: { $exists: true, $ne: "" },
    status: { $in: ["ACTIVE", "INDUCTION_COMPLETED"] },
  };
  if (contractor) {
    base.companyName = {
      $regex: contractor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
  }
  if (nic) base.nicNumber = nic;

  const filter = scopedEmployeeFilter(
    guard.session.user.role,
    guard.session.user.id,
    base,
  );

  const rows = await EmployeeModel.find(filter)
    .select(
      "employeeId nicNumber name companyName tradeType designation status idCardExpiresAt photoUrl",
    )
    .sort({ companyName: 1, name: 1 })
    .lean();

  return NextResponse.json({
    count: rows.length,
    employees: rows.map((r) => ({
      id: String(r._id),
      employeeId: r.employeeId ?? null,
      nicNumber: r.nicNumber,
      name: r.name,
      companyName: r.companyName,
      tradeType: r.tradeType,
      designation: r.designation ?? "",
      status: r.status,
      photoUrl: r.nicNumber
        ? `/api/photos/EMPLOYEE/${encodeURIComponent(r.nicNumber)}`
        : null,
      idCardExpiresAt: r.idCardExpiresAt ?? null,
    })),
  });
}
