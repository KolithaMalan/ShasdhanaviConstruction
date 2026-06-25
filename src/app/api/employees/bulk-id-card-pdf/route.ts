import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { generateBulkPDF } from "@/lib/utils/generateBulkPDF";
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

  const filter = scopedEmployeeFilter(
    guard.session.user.role,
    guard.session.user.id,
    {
      _id: { $in: ids },
      qrCodeData: { $exists: true, $ne: "" },
      status: { $in: ["ACTIVE", "INDUCTION_COMPLETED"] },
    },
  );

  const docs = await EmployeeModel.find(filter);
  if (docs.length === 0) return jsonError("No matching employees with QR codes", 404);

  const buffer = await generateBulkPDF(docs);

  void logAction({
    userId: guard.session.user.id,
    userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "",
    userRole: guard.session.user.role,
    action: "DOWNLOAD_REPORT",
    entityType: "IdCard",
    entityId: "BULK",
    description: `Downloaded bulk ID card PDF for ${docs.length} employees`,
    request: req,
  });

  const filename = `idcards-${new Date().toISOString().slice(0, 10)}.pdf`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
