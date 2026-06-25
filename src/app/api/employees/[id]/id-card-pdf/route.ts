import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { generateIDCardPDF } from "@/lib/utils/generateIDCardPDF";
import { requireRole, jsonError } from "@/lib/api";
import { canAccessEmployee, DOWNLOAD_ROLES } from "@/lib/employeeAccess";
import { logAction } from "@/lib/auditLogger";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(DOWNLOAD_ROLES);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  await connectDB();
  const doc = await EmployeeModel.findById(id);
  if (!doc) return jsonError("Employee not found", 404);

  if (!canAccessEmployee(guard.session.user.role, guard.session.user.id, doc)) {
    return jsonError("Forbidden", 403);
  }
  if (!doc.qrCodeData) {
    return jsonError("Employee ID card not issued yet", 404);
  }

  const buffer = await generateIDCardPDF(doc);

  void logAction({
    userId: guard.session.user.id,
    userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "",
    userRole: guard.session.user.role,
    action: "DOWNLOAD_REPORT",
    entityType: "IdCard",
    entityId: doc.employeeId ?? doc.nicNumber,
    description: `Downloaded ID card PDF for ${doc.name}`,
    request: req,
  });

  const filename = `idcard-${doc.employeeId ?? doc.nicNumber}.pdf`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
