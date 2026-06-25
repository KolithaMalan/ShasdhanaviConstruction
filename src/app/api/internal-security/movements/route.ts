import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { ToolMovementModel } from "@/models/ToolMovement";
import { requireRole } from "@/lib/api";
import { SCAN_DIRECTIONS, TOOL_MOVEMENT_TYPES } from "@/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["INTERNAL_SECURITY", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const direction = searchParams.get("direction");
  const toolType = searchParams.get("toolType");
  const contractor = searchParams.get("contractor")?.trim();
  const gatePassId = searchParams.get("gatePassId")?.trim();
  const q = searchParams.get("q")?.trim();
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const filter: Record<string, unknown> = {};
  if (direction && SCAN_DIRECTIONS.includes(direction as never)) filter.direction = direction;
  if (toolType && TOOL_MOVEMENT_TYPES.includes(toolType as never)) filter.toolType = toolType;
  if (contractor) filter.companyName = contractor;
  if (gatePassId) filter.gatePassId = { $regex: gatePassId, $options: "i" };
  if (q) {
    filter.$or = [
      { toolName: { $regex: q, $options: "i" } },
      { gatePassId: { $regex: q, $options: "i" } },
      { toolIdentifier: { $regex: q.toUpperCase(), $options: "i" } },
    ];
  }
  if (startDate || endDate) {
    const range: Record<string, Date> = {};
    if (startDate) range.$gte = new Date(startDate);
    if (endDate) { const e = new Date(endDate); e.setHours(23, 59, 59, 999); range.$lte = e; }
    filter.processedAt = range;
  }

  await connectDB();
  const docs = await ToolMovementModel.find(filter).sort({ processedAt: -1 }).limit(1000).lean();

  return NextResponse.json({
    items: docs.map((d) => ({
      id: String(d._id),
      contractorId: String(d.contractorId),
      companyName: d.companyName,
      toolType: d.toolType,
      toolName: d.toolName,
      toolIdentifier: d.toolIdentifier,
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
