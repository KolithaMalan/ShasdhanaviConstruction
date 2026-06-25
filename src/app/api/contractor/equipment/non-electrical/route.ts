import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { NonElectricalToolModel } from "@/models/NonElectricalTool";
import { serializeNonElectricalTool } from "@/lib/tools";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["CONTRACTOR"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();

  const filter: Record<string, unknown> = { contractorId: guard.session.user.id };
  if (status === "ACTIVE" || status === "DEPLETED" || status === "BLOCKED") filter.status = status;
  if (q) {
    filter.$or = [
      { toolName: { $regex: q, $options: "i" } },
      { toolId: { $regex: q.toUpperCase(), $options: "i" } },
    ];
  }

  await connectDB();
  const docs = await NonElectricalToolModel.find(filter).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ items: docs.map(serializeNonElectricalTool) });
}
