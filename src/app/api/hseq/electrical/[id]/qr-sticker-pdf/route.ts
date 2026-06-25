import mongoose from "mongoose";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";

import { connectDB } from "@/lib/db";
import { ElectricalEquipmentModel } from "@/models/ElectricalEquipment";
import { serializeElectricalEquipment } from "@/lib/tools";
import { qrPngDataUrl } from "@/lib/qr";
import { QrStickerPdf } from "@/components/pdf/QrStickerPdf";
import { requireRole, jsonError } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(["HSEQ_OFFICER", "SUPER_ADMIN", "ADMIN_HSEQ", "CONTRACTOR"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  await connectDB();
  const filter: Record<string, unknown> = { _id: id };
  if (guard.session.user.role === "CONTRACTOR") filter.contractorId = guard.session.user.id;
  const doc = await ElectricalEquipmentModel.findOne(filter).lean();
  if (!doc) return jsonError("Not found", 404);

  const equipment = serializeElectricalEquipment(doc);
  const qrDataUrl = await qrPngDataUrl(doc.qrCodeData, 600);

  const element = React.createElement(QrStickerPdf, { equipment, qrDataUrl });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="qr-sticker-${equipment.equipmentId}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
