import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { generateQRCode } from "@/lib/utils/generateQRCode";
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
  const doc = await EmployeeModel.findById(id)
    .select("name nicNumber employeeId qrCodeData contractorId")
    .lean();
  if (!doc) return jsonError("Employee not found", 404);

  if (!canAccessEmployee(guard.session.user.role, guard.session.user.id, doc)) {
    return jsonError("Forbidden", 403);
  }
  if (!doc.qrCodeData) return jsonError("Employee has no QR code on file", 404);

  const buffer = await generateQRCode(doc.qrCodeData, 512);

  void logAction({
    userId: guard.session.user.id,
    userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "",
    userRole: guard.session.user.role,
    action: "DOWNLOAD_REPORT",
    entityType: "EmployeeQR",
    entityId: doc.employeeId ?? doc.nicNumber,
    description: `Downloaded QR for ${doc.name}`,
    request: req,
  });

  const safeName = doc.name.replace(/[^A-Za-z0-9._-]+/g, "_");
  const filename = `qr-${doc.employeeId ?? doc.nicNumber}-${safeName}.png`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
