import mongoose from "mongoose";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";

import { connectDB } from "@/lib/db";
import { ElectricalEquipmentModel } from "@/models/ElectricalEquipment";
import { serializeElectricalEquipment } from "@/lib/tools";
import { SafetyPassStickerPdf } from "@/components/pdf/SafetyPassStickerPdf";
import { requireRole, jsonError } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(["HSEQ_OFFICER", "SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  await connectDB();
  const doc = await ElectricalEquipmentModel.findById(id).lean();
  if (!doc) return jsonError("Not found", 404);
  if (doc.inspectionStatus !== "PASSED") return jsonError("Equipment has not passed inspection", 409);

  const equipment = serializeElectricalEquipment(doc);
  const element = React.createElement(SafetyPassStickerPdf, { equipment });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="safety-pass-${equipment.equipmentId}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
