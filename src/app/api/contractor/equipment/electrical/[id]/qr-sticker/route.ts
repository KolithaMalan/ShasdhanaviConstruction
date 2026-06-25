import mongoose from "mongoose";
import QRCode from "qrcode";

import { connectDB } from "@/lib/db";
import { ElectricalEquipmentModel } from "@/models/ElectricalEquipment";
import { requireRole, jsonError } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(["CONTRACTOR"]);
  if (!guard.ok) return guard.response;
  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  await connectDB();
  const doc = await ElectricalEquipmentModel.findOne({
    _id: id, contractorId: guard.session.user.id,
  }).lean();
  if (!doc) return jsonError("Not found", 404);
  if (doc.inspectionStatus !== "PASSED") return jsonError("Equipment has not passed inspection", 409);

  const buffer = await QRCode.toBuffer(doc.qrCodeData, {
    errorCorrectionLevel: "H",
    margin: 2, width: 720,
    color: { dark: "#19183B", light: "#FFFFF0" },
  });
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="electrical-${doc.equipmentId}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
