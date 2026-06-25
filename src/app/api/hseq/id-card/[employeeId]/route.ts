import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { serializeEmployee } from "@/lib/employee";
import { qrPngDataUrl } from "@/lib/qr";
import { requireRole, jsonError } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ employeeId: string }> }) {
  const guard = await requireRole(["HSEQ_OFFICER", "SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  const { employeeId } = await ctx.params;
  await connectDB();
  const doc = await EmployeeModel.findOne({ employeeId }).lean();
  if (!doc || !doc.qrCodeData) return jsonError("ID card not found", 404);

  const qrDataUrl = await qrPngDataUrl(doc.qrCodeData);
  return NextResponse.json({ item: serializeEmployee(doc), qrDataUrl });
}
