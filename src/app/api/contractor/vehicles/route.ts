import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { VehicleModel } from "@/models/Vehicle";
import { serializeVehicle } from "@/lib/vehicle";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireRole(["CONTRACTOR"]);
  if (!guard.ok) return guard.response;

  await connectDB();
  const docs = await VehicleModel.find({ contractorId: guard.session.user.id })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ items: docs.map(serializeVehicle) });
}
