import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { PermanentEmployeeModel } from "@/models/PermanentEmployee";
import { WorkerModel } from "@/models/Worker";
import { VehicleModel } from "@/models/Vehicle";
import { UserModel } from "@/models/User";
import { MovementLogModel } from "@/models/MovementLog";
import { ElectricalEquipmentModel } from "@/models/ElectricalEquipment";
import { NonElectricalToolModel } from "@/models/NonElectricalTool";
import { requireRole } from "@/lib/api";
import { WORKER_COMPANIES } from "@/types";

export const runtime = "nodejs";

interface AggRow {
  _id: unknown;
  total?: number;
  inside?: number;
  qty?: number;
}

/** Live site overview powering Nuwan's primary dashboard. */
export async function GET() {
  const guard = await requireRole(["ADMIN_HSEQ", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  await connectDB();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    laborersInside, permanentInside, workersInside, vehiclesInside,
    todayIn, todayOut, scansToday,
    recentMovements,
    contractors, employeeAgg, elecAgg, nonElecAgg,
    electricalOnSiteAgg, workers,
  ] = await Promise.all([
    EmployeeModel.countDocuments({ currentStatus: "IN", status: "ACTIVE" }),
    PermanentEmployeeModel.countDocuments({ currentStatus: "IN" }),
    WorkerModel.countDocuments({ currentStatus: "IN" }),
    VehicleModel.countDocuments({ currentStatus: "IN", status: "ACTIVE" }),

    MovementLogModel.countDocuments({ direction: "IN", scannedAt: { $gte: startOfDay } }),
    MovementLogModel.countDocuments({ direction: "OUT", scannedAt: { $gte: startOfDay } }),
    MovementLogModel.countDocuments({ scannedAt: { $gte: startOfDay } }),

    MovementLogModel.find({}).sort({ scannedAt: -1 }).limit(20).lean(),

    UserModel.find({ role: "CONTRACTOR", isActive: true })
      .select("_id name companyName")
      .sort({ companyName: 1 })
      .lean(),

    /* Laborers per contractor (active), with how many are inside right now */
    EmployeeModel.aggregate<AggRow>([
      { $match: { status: "ACTIVE" } },
      {
        $group: {
          _id: "$contractorId",
          total: { $sum: 1 },
          inside: { $sum: { $cond: [{ $eq: ["$currentStatus", "IN"] }, 1, 0] } },
        },
      },
    ]),
    /* Electrical tools on site per contractor (approved inventory) */
    ElectricalEquipmentModel.aggregate<AggRow>([
      { $match: { status: "APPROVED_INVENTORY" } },
      { $group: { _id: "$contractorId", qty: { $sum: "$currentBalance" }, total: { $sum: 1 } } },
    ]),
    /* Non-electrical tools registered per contractor */
    NonElectricalToolModel.aggregate<AggRow>([
      { $match: { status: "ACTIVE" } },
      { $group: { _id: "$contractorId", qty: { $sum: "$currentBalance" }, total: { $sum: 1 } } },
    ]),
    /* Total electrical tools available on site (all contractors) */
    ElectricalEquipmentModel.aggregate<{ _id: null; qty: number; total: number }>([
      { $match: { status: "APPROVED_INVENTORY" } },
      { $group: { _id: null, qty: { $sum: "$currentBalance" }, total: { $sum: 1 } } },
    ]),

    WorkerModel.find({}).sort({ name: 1 }).limit(500).lean(),
  ]);

  const byId = (rows: AggRow[]) => {
    const m = new Map<string, AggRow>();
    for (const r of rows) m.set(String(r._id), r);
    return m;
  };
  const empMap = byId(employeeAgg);
  const elecMap = byId(elecAgg);
  const nonElecMap = byId(nonElecAgg);

  const contractorRows = contractors.map((c) => {
    const key = String(c._id);
    const e = empMap.get(key);
    const el = elecMap.get(key);
    const ne = nonElecMap.get(key);
    return {
      id: key,
      companyName: c.companyName ?? c.name ?? "—",
      laborers: e?.total ?? 0,
      laborersInside: e?.inside ?? 0,
      electricalTools: el?.qty ?? 0,
      nonElectricalTools: ne?.qty ?? 0,
    };
  });

  const workerRows = workers.map((w) => ({
    id: String(w._id),
    name: w.name,
    workerId: w.workerId ?? "",
    company: w.company ?? "",
    department: w.department ?? "",
    designation: w.designation ?? "",
    currentStatus: (w.currentStatus ?? "OUT") as "IN" | "OUT",
    lastScanAt: w.lastScanAt ? new Date(w.lastScanAt).toISOString() : null,
  }));

  const workerCompanies = WORKER_COMPANIES.map((company) => ({
    company,
    inside: workerRows.filter((w) => w.company === company && w.currentStatus === "IN").length,
    total: workerRows.filter((w) => w.company === company).length,
  }));

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    headCount: {
      total: laborersInside + permanentInside + workersInside,
      laborers: laborersInside,
      permanent: permanentInside,
      workers: workersInside,
    },
    attendance: {
      todayIn,
      todayOut,
      scansToday,
      recent: recentMovements.map((m) => ({
        id: String(m._id),
        name: m.entityName,
        identifier: m.entityIdentifier,
        entityType: m.entityType,
        company: m.companyName ?? "",
        direction: m.direction,
        scannedAt: m.scannedAt ? new Date(m.scannedAt).toISOString() : null,
        gateLocation: m.gateLocation ?? "",
      })),
    },
    vehiclesInside,
    electricalToolsOnSite: electricalOnSiteAgg[0]?.qty ?? 0,
    electricalToolItems: electricalOnSiteAgg[0]?.total ?? 0,
    contractors: contractorRows,
    workerCompanies,
    workers: workerRows,
  });
}
