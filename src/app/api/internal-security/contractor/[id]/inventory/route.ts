import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import { ElectricalEquipmentModel } from "@/models/ElectricalEquipment";
import { NonElectricalToolModel } from "@/models/NonElectricalTool";
import { serializeElectricalEquipment, serializeNonElectricalTool } from "@/lib/tools";
import { requireRole, jsonError } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(["INTERNAL_SECURITY", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  await connectDB();
  const user = await UserModel.findOne({ _id: id, role: "CONTRACTOR" }).lean();
  if (!user) return jsonError("Contractor not found", 404);

  const [electrical, nonElectrical] = await Promise.all([
    ElectricalEquipmentModel.find({ contractorId: id }).sort({ toolName: 1 }).lean(),
    NonElectricalToolModel.find({ contractorId: id }).sort({ toolName: 1 }).lean(),
  ]);

  return NextResponse.json({
    contractor: {
      id: String(user._id),
      companyName: user.companyName ?? user.name,
      email: user.email,
    },
    electrical: electrical.map(serializeElectricalEquipment),
    nonElectrical: nonElectrical.map(serializeNonElectricalTool),
  });
}
