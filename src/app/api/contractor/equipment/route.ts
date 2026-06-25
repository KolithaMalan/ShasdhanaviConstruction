import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import { ContractorRegistrationModel } from "@/models/ContractorRegistration";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireRole(["CONTRACTOR"]);
  if (!guard.ok) return guard.response;

  await connectDB();
  const user = await UserModel.findById(guard.session.user.id).lean();
  if (!user?.registrationId) return NextResponse.json({ electrical: [], nonElectrical: [] });

  const reg = await ContractorRegistrationModel.findById(user.registrationId).lean();
  return NextResponse.json({
    electrical: (reg?.electricalEquipment ?? []).map((e) => ({ id: String(e._id), ...e })),
    nonElectrical: (reg?.nonElectricalTools ?? []).map((e) => ({ id: String(e._id), ...e })),
  });
}
