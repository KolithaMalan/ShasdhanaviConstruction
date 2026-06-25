import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { NonElectricalToolModel } from "@/models/NonElectricalTool";
import { ToolMovementModel } from "@/models/ToolMovement";
import { serializeNonElectricalTool } from "@/lib/tools";
import { requireRole, jsonError } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(["CONTRACTOR"]);
  if (!guard.ok) return guard.response;
  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  await connectDB();
  const doc = await NonElectricalToolModel.findOne({
    _id: id, contractorId: guard.session.user.id,
  }).lean();
  if (!doc) return jsonError("Not found", 404);

  const movements = await ToolMovementModel.find({ toolId: id }).sort({ processedAt: -1 }).limit(200).lean();

  return NextResponse.json({
    item: serializeNonElectricalTool(doc),
    movements: movements.map((m) => ({
      id: String(m._id),
      direction: m.direction,
      quantity: m.quantity,
      balanceBefore: m.balanceBefore,
      balanceAfter: m.balanceAfter,
      gatePassId: m.gatePassId,
      processedAt: m.processedAt,
      processedByName: m.processedByName,
      notes: m.notes,
    })),
  });
}
