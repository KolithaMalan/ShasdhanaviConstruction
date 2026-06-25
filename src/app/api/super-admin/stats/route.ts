import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { VehicleModel } from "@/models/Vehicle";
import { VisitorModel } from "@/models/Visitor";
import { UserModel } from "@/models/User";
import { MovementLogModel } from "@/models/MovementLog";
import { ContractorRegistrationModel } from "@/models/ContractorRegistration";
import { AdditionalRequestModel } from "@/models/AdditionalRequest";
import { ElectricalEquipmentModel } from "@/models/ElectricalEquipment";
import { checkExpiredIdCards } from "@/lib/idCardChecker";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireRole(["SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  await connectDB();
  await checkExpiredIdCards();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    totalEmployees, activeEmployees, employeesInside, vehiclesInside, visitorsInside,
    totalContractors, scansToday, inToday, outToday,
    pendingRegistrations, pendingAdditional, pendingMedical, pendingInspections, expiredIds,
  ] = await Promise.all([
    EmployeeModel.countDocuments({}),
    EmployeeModel.countDocuments({ status: "ACTIVE" }),
    EmployeeModel.countDocuments({ currentStatus: "IN", status: "ACTIVE" }),
    VehicleModel.countDocuments({ currentStatus: "IN", status: "ACTIVE" }),
    VisitorModel.countDocuments({ currentStatus: "IN" }),
    UserModel.countDocuments({ role: "CONTRACTOR", isActive: true }),
    MovementLogModel.countDocuments({ scannedAt: { $gte: startOfDay } }),
    MovementLogModel.countDocuments({ direction: "IN",  scannedAt: { $gte: startOfDay } }),
    MovementLogModel.countDocuments({ direction: "OUT", scannedAt: { $gte: startOfDay } }),
    ContractorRegistrationModel.countDocuments({ status: "PENDING" }),
    AdditionalRequestModel.countDocuments({ status: "PENDING" }),
    EmployeeModel.countDocuments({ status: "PENDING_MEDICAL" }),
    ElectricalEquipmentModel.countDocuments({ inspectionStatus: "PENDING_INSPECTION" }),
    EmployeeModel.countDocuments({ status: "DEACTIVATED" }),
  ]);

  return NextResponse.json({
    totalEmployees,
    activeEmployees,
    inactiveEmployees: totalEmployees - activeEmployees,
    currentlyInside: {
      employees: employeesInside,
      vehicles: vehiclesInside,
      visitors: visitorsInside,
      total: employeesInside + vehiclesInside + visitorsInside,
    },
    totalContractors,
    todayScans: {
      total: scansToday,
      in: inToday,
      out: outToday,
    },
    pending: {
      registrations: pendingRegistrations,
      additional: pendingAdditional,
      medical: pendingMedical,
      inspections: pendingInspections,
      total: pendingRegistrations + pendingAdditional + pendingMedical + pendingInspections,
    },
    alerts: {
      expiredIds,
      pendingRegistrations,
      pendingMedical,
      pendingInspections,
    },
    systemHealth: {
      database: "OK",
      generatedAt: new Date().toISOString(),
    },
  });
}
