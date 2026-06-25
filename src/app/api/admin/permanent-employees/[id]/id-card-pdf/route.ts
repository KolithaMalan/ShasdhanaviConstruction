import mongoose from "mongoose";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";

import { connectDB } from "@/lib/db";
import { PermanentEmployeeModel } from "@/models/PermanentEmployee";
import { requireRole, jsonError } from "@/lib/api";
import { serializePermanentEmployee } from "@/lib/permanentEmployee";
import { qrPngDataUrl } from "@/lib/qr";
import { getSahasLogoDataUrl } from "@/lib/brandAssets";
import { PermanentIdCardPdf } from "@/components/pdf/PermanentIdCardPdf";
import { logAction } from "@/lib/auditLogger";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(["ADMIN_HSEQ", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  await connectDB();
  const doc = await PermanentEmployeeModel.findById(id)
    .select("+photoData +photoMimeType")
    .exec();
  if (!doc) return jsonError("Permanent employee not found", 404);
  if (!doc.qrCodeData) return jsonError("ID card not issued yet", 404);

  const employee = serializePermanentEmployee(doc);
  const [qrDataUrl, logoDataUrl] = await Promise.all([
    qrPngDataUrl(doc.qrCodeData, 600),
    getSahasLogoDataUrl(),
  ]);

  let photoDataUrl: string | null = null;
  const rawPhoto = doc.photoData as unknown;
  let photoBuf: Buffer | null = null;
  if (Buffer.isBuffer(rawPhoto)) {
    photoBuf = rawPhoto;
  } else if (
    rawPhoto &&
    typeof rawPhoto === "object" &&
    "buffer" in (rawPhoto as Record<string, unknown>) &&
    Buffer.isBuffer((rawPhoto as { buffer: unknown }).buffer)
  ) {
    photoBuf = (rawPhoto as { buffer: Buffer }).buffer;
  }
  if (photoBuf && photoBuf.length > 0) {
    photoDataUrl = `data:${doc.photoMimeType || "image/jpeg"};base64,${photoBuf.toString("base64")}`;
  }

  const element = React.createElement(PermanentIdCardPdf, { employee, qrDataUrl, logoDataUrl, photoDataUrl });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);

  void logAction({
    userId: guard.session.user.id,
    userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "",
    userRole: guard.session.user.role,
    action: "DOWNLOAD_REPORT",
    entityType: "PermanentIdCard",
    entityId: employee.permanentId,
    description: `Downloaded permanent ID card for ${employee.name}`,
    request: req,
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="permanent-id-${employee.permanentId}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
