import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { ToolMovementModel } from "@/models/ToolMovement";
import { requireRole, jsonError } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(["SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;
  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  await connectDB();
  const docs = await ToolMovementModel.find({ toolId: id }).sort({ processedAt: -1 }).limit(500).lean();
  return NextResponse.json({
    items: docs.map((d) => ({
      id: String(d._id),
      direction: d.direction,
      quantity: d.quantity,
      balanceBefore: d.balanceBefore,
      balanceAfter: d.balanceAfter,
      gatePassId: d.gatePassId,
      processedAt: d.processedAt,
      processedByName: d.processedByName,
      notes: d.notes,
    })),
  });
}
