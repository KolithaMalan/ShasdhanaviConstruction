import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import { ContractorRegistrationModel } from "@/models/ContractorRegistration";
import { AdditionalRequestModel } from "@/models/AdditionalRequest";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireRole(["CONTRACTOR"]);
  if (!guard.ok) return guard.response;

  await connectDB();
  const user = await UserModel.findById(guard.session.user.id).lean();
  if (!user) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const reg = user.registrationId
    ? await ContractorRegistrationModel.findById(user.registrationId).lean()
    : null;

  const requestCounts = await AdditionalRequestModel.aggregate([
    { $match: { contractorId: user._id } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  return NextResponse.json({
    profile: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      companyName: user.companyName,
      brNumber: user.brNumber,
    },
    stats: {
      employees: reg?.labourList.length ?? 0,
      vehicles: reg?.vehicles.length ?? 0,
      electricalEquipment: reg?.electricalEquipment.length ?? 0,
      nonElectricalTools: reg?.nonElectricalTools.length ?? 0,
      requestsByStatus: Object.fromEntries(
        requestCounts.map((r: { _id: string; count: number }) => [r._id, r.count]),
      ),
    },
  });
}
