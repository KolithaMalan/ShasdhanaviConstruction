import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { ElectricalEquipmentModel } from "@/models/ElectricalEquipment";
import { checkExpiredIdCards } from "@/lib/idCardChecker";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireRole(["HSEQ_OFFICER", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  await connectDB();
  await checkExpiredIdCards();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const inSevenDays = new Date();
  inSevenDays.setDate(inSevenDays.getDate() + 7);

  const [
    awaiting, inductedToday, totalActive, expiringSoon,
    pendingElectrical, passedToday, failedToday, equipmentBlocked,
  ] = await Promise.all([
    EmployeeModel.countDocuments({ status: "MEDICAL_PASSED" }),
    EmployeeModel.countDocuments({ inductionCompletedAt: { $gte: startOfDay } }),
    EmployeeModel.countDocuments({ status: "ACTIVE" }),
    EmployeeModel.countDocuments({
      status: "ACTIVE",
      idCardExpiresAt: { $gte: new Date(), $lte: inSevenDays },
    }),
    ElectricalEquipmentModel.countDocuments({ inspectionStatus: "PENDING_INSPECTION" }),
    ElectricalEquipmentModel.countDocuments({
      inspectionStatus: "PASSED", inspectedAt: { $gte: startOfDay },
    }),
    ElectricalEquipmentModel.countDocuments({
      inspectionStatus: "FAILED", inspectedAt: { $gte: startOfDay },
    }),
    ElectricalEquipmentModel.countDocuments({ status: "BLOCKED" }),
  ]);

  return NextResponse.json({
    awaiting, inductedToday, totalActive, expiringSoon,
    pendingElectrical, passedToday, failedToday, equipmentBlocked,
  });
}
