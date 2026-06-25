import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { VehicleModel } from "@/models/Vehicle";
import { serializeVehicle } from "@/lib/vehicle";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const contractor = searchParams.get("contractor")?.trim();
  const q = searchParams.get("q")?.trim();

  const filter: Record<string, unknown> = {};
  if (contractor) filter.companyName = contractor;
  if (q) {
    filter.$or = [
      { vehicleNumber: { $regex: q.toUpperCase(), $options: "i" } },
      { vehicleQrId: { $regex: q.toUpperCase(), $options: "i" } },
      { companyName: { $regex: q, $options: "i" } },
    ];
  }

  await connectDB();
  const docs = await VehicleModel.find(filter).sort({ createdAt: -1 }).limit(500).lean();
  return NextResponse.json({ items: docs.map(serializeVehicle) });
}
