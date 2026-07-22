import mongoose from "mongoose";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";

import { connectDB } from "@/lib/db";
import { WorkerModel } from "@/models/Worker";
import { requireRole, jsonError } from "@/lib/api";
import { serializeWorker } from "@/lib/worker";
import { qrPngDataUrl } from "@/lib/qr";
import { getSahasLogoDataUrl } from "@/lib/brandAssets";
import { WorkerIdCardPdf } from "@/components/pdf/WorkerIdCardPdf";
import { logAction } from "@/lib/auditLogger";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(["ADMIN_HSEQ", "HSEQ_OFFICER", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  await connectDB();
  const doc = await WorkerModel.findById(id).select("+photoData +photoMimeType").exec();
  if (!doc) return jsonError("Worker not found", 404);
  if (!doc.qrCodeData) return jsonError("ID card not issued yet", 404);

  const worker = serializeWorker(doc);
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

  const element = React.createElement(WorkerIdCardPdf, { worker, qrDataUrl, logoDataUrl, photoDataUrl });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);

  void logAction({
    userId: guard.session.user.id,
    userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "",
    userRole: guard.session.user.role,
    action: "DOWNLOAD_REPORT",
    entityType: "WorkerIdCard",
    entityId: worker.workerId,
    description: `Downloaded worker ID card for ${worker.name}`,
    request: req,
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="worker-id-${worker.workerId}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
