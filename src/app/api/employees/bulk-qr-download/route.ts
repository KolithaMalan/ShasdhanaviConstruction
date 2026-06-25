import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { generateBulkZIP } from "@/lib/utils/generateBulkZIP";
import { requireRole, jsonError } from "@/lib/api";
import { DOWNLOAD_ROLES, scopedEmployeeFilter } from "@/lib/employeeAccess";
import { logAction } from "@/lib/auditLogger";

export const runtime = "nodejs";

interface BulkBody {
  employeeIds: string[];
}

export async function POST(req: Request) {
  const guard = await requireRole(DOWNLOAD_ROLES);
  if (!guard.ok) return guard.response;

  const body = (await req.json().catch(() => ({}))) as Partial<BulkBody>;
  const ids = (body.employeeIds ?? []).filter((id) =>
    mongoose.Types.ObjectId.isValid(id),
  );
  if (ids.length === 0) return jsonError("No valid employee ids", 400);

  await connectDB();

  /* Scope the query so contractors can only ZIP their own employees, even
     if the client requests other contractors' ids. */
  const filter = scopedEmployeeFilter(
    guard.session.user.role,
    guard.session.user.id,
    {
      _id: { $in: ids },
      qrCodeData: { $exists: true, $ne: "" },
      status: { $in: ["ACTIVE", "INDUCTION_COMPLETED"] },
    },
  );

  const rows = await EmployeeModel.find(filter)
    .select("employeeId nicNumber name companyName qrCodeData")
    .lean();

  if (rows.length === 0) return jsonError("No matching employees with QR codes", 404);
  if (rows.length !== ids.length && guard.session.user.role === "CONTRACTOR") {
    /* Silently dropping unauthorized ids is fine — contractor still gets
       only their own. We just don't surface other contractors' ids. */
  }

  const stream = generateBulkZIP(rows as Parameters<typeof generateBulkZIP>[0]);

  void logAction({
    userId: guard.session.user.id,
    userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "",
    userRole: guard.session.user.role,
    action: "DOWNLOAD_REPORT",
    entityType: "EmployeeQR",
    entityId: "BULK",
    description: `Downloaded QR ZIP for ${rows.length} employees`,
    request: req,
  });

  const zipName = `employee-qrs-${new Date().toISOString().slice(0, 10)}.zip`;
  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipName}"`,
      "Cache-Control": "no-store",
    },
  });
}
