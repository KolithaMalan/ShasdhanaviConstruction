import { renderToBuffer } from "@react-pdf/renderer";
import { promises as fs } from "node:fs";
import path from "node:path";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { serializeEmployee } from "@/lib/employee";
import { qrPngDataUrl } from "@/lib/qr";
import { getPhotoAsBase64Url } from "@/lib/photoService";
import { IdCardPdf } from "@/components/pdf/IdCardPdf";
import { logAction } from "@/lib/auditLogger";
import { requireRole, jsonError } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ employeeId: string }> }) {
  const guard = await requireRole(["HSEQ_OFFICER", "SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  const { employeeId } = await ctx.params;
  await connectDB();
  const doc = await EmployeeModel.findOne({ employeeId }).lean();
  if (!doc || !doc.qrCodeData) return jsonError("ID card not found", 404);

  const employee = serializeEmployee(doc);
  const qrDataUrl = await qrPngDataUrl(doc.qrCodeData);

  /* Photo: prefer MongoDB; fall back to legacy filesystem URL. */
  let photoAbsoluteUrl: string | null = null;
  try {
    photoAbsoluteUrl = await getPhotoAsBase64Url("EMPLOYEE", doc.nicNumber);
  } catch {
    photoAbsoluteUrl = null;
  }
  if (!photoAbsoluteUrl && employee.photoUrl && employee.photoUrl.startsWith("/uploads/")) {
    try {
      const fullPath = path.join(process.cwd(), "public", employee.photoUrl.replace(/^\//, ""));
      const buf = await fs.readFile(fullPath);
      const ext = path.extname(fullPath).slice(1).toLowerCase();
      const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      photoAbsoluteUrl = `data:${mime};base64,${buf.toString("base64")}`;
    } catch {
      photoAbsoluteUrl = null;
    }
  }

  const React = await import("react");
  const element = React.createElement(IdCardPdf, { employee, qrDataUrl, photoAbsoluteUrl });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);

  void logAction({
    userId: guard.session.user.id,
    userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "",
    userRole: guard.session.user.role,
    action: "DOWNLOAD_REPORT",
    entityType: "IdCard",
    entityId: employee.employeeId ?? "",
    description: `Downloaded ID card PDF for ${employee.name}`,
    request: req,
  });

  const filename = `id-card-${employee.employeeId ?? employee.nicNumber}.pdf`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
