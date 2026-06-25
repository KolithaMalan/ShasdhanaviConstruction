import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { ElectricalEquipmentModel } from "@/models/ElectricalEquipment";
import { serializeElectricalEquipment } from "@/lib/tools";
import { qrPngDataUrl } from "@/lib/qr";
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

  const qrDataUrl = await qrPngDataUrl(doc.qrCodeData);
  return NextResponse.json({ item: serializeElectricalEquipment(doc), qrDataUrl });
}
