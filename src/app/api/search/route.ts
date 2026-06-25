import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { UserModel } from "@/models/User";
import { VehicleModel } from "@/models/Vehicle";
import { VisitorModel } from "@/models/Visitor";
import { ElectricalEquipmentModel } from "@/models/ElectricalEquipment";
import { NonElectricalToolModel } from "@/models/NonElectricalTool";
import { requireSession } from "@/lib/api";

export const runtime = "nodejs";

const PER_CATEGORY = 5;

export async function GET(req: Request) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({
      employees: [], contractors: [], vehicles: [], visitors: [],
      equipment: [], nonElectricalTools: [],
    });
  }

  const role = guard.session.user.role;
  const userId = guard.session.user.id;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rx = new RegExp(escaped, "i");
  const rxUpper = new RegExp(escaped.toUpperCase(), "i");

  await connectDB();

  /* ── role-aware scoping ───────────────────────── */
  const scope: Record<string, unknown> = {};
  if (role === "CONTRACTOR") scope.contractorId = userId;

  const tasks: Array<Promise<unknown>> = [];

  // Employees — visible to ADMIN, SUPER_ADMIN, MEDICAL, HSEQ, SECURITY, CONTRACTOR(own)
  const employeesAllowed = ["SUPER_ADMIN", "ADMIN_HSEQ", "MEDICAL_OFFICER", "HSEQ_OFFICER", "SECURITY_OFFICER", "CONTRACTOR", "INTERNAL_SECURITY"].includes(role);
  const employeesTask = employeesAllowed
    ? EmployeeModel.find({
        ...scope,
        $or: [{ name: rx }, { nicNumber: rxUpper }, { employeeId: rxUpper }],
      }).limit(PER_CATEGORY).select("name nicNumber employeeId companyName status photoUrl tradeType").lean()
    : Promise.resolve([]);
  tasks.push(employeesTask);

  // Contractors (= Users with role CONTRACTOR) — Admin/Super only
  const contractorsAllowed = ["SUPER_ADMIN", "ADMIN_HSEQ"].includes(role);
  const contractorsTask = contractorsAllowed
    ? UserModel.find({
        role: "CONTRACTOR",
        $or: [{ companyName: rx }, { email: rx }, { brNumber: rx }],
      }).limit(PER_CATEGORY).select("companyName email brNumber").lean()
    : Promise.resolve([]);
  tasks.push(contractorsTask);

  // Vehicles
  const vehiclesAllowed = ["SUPER_ADMIN", "ADMIN_HSEQ", "SECURITY_OFFICER", "CONTRACTOR", "INTERNAL_SECURITY"].includes(role);
  const vehiclesTask = vehiclesAllowed
    ? VehicleModel.find({
        ...scope,
        $or: [{ vehicleNumber: rxUpper }, { vehicleQrId: rxUpper }],
      }).limit(PER_CATEGORY).select("vehicleNumber vehicleType companyName vehicleQrId currentStatus").lean()
    : Promise.resolve([]);
  tasks.push(vehiclesTask);

  // Visitors — Admin/Security
  const visitorsAllowed = ["SUPER_ADMIN", "ADMIN_HSEQ", "SECURITY_OFFICER"].includes(role);
  const visitorsTask = visitorsAllowed
    ? VisitorModel.find({
        $or: [{ name: rx }, { nicNumber: rxUpper }, { visitorPassId: rxUpper }],
      }).sort({ enteredAt: -1 }).limit(PER_CATEGORY).select("name nicNumber visitorPassId company enteredAt currentStatus").lean()
    : Promise.resolve([]);
  tasks.push(visitorsTask);

  // Electrical equipment
  const eqAllowed = ["SUPER_ADMIN", "ADMIN_HSEQ", "HSEQ_OFFICER", "INTERNAL_SECURITY", "CONTRACTOR"].includes(role);
  const equipmentTask = eqAllowed
    ? ElectricalEquipmentModel.find({
        ...scope,
        $or: [{ toolName: rx }, { equipmentId: rxUpper }],
      }).limit(PER_CATEGORY).select("toolName equipmentId companyName currentBalance status").lean()
    : Promise.resolve([]);
  tasks.push(equipmentTask);

  // Non-electrical
  const toolsTask = eqAllowed
    ? NonElectricalToolModel.find({
        ...scope,
        $or: [{ toolName: rx }, { toolId: rxUpper }],
      }).limit(PER_CATEGORY).select("toolName toolId companyName currentBalance approvedQuantity unit status").lean()
    : Promise.resolve([]);
  tasks.push(toolsTask);

  const [employees, contractors, vehicles, visitors, equipment, nonElectricalTools] = await Promise.all(tasks);

  return NextResponse.json({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    employees: (employees as any[]).map((e) => ({
      id: String(e._id), name: e.name, nicNumber: e.nicNumber,
      employeeId: e.employeeId ?? null, companyName: e.companyName,
      status: e.status, tradeType: e.tradeType,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contractors: (contractors as any[]).map((c) => ({
      id: String(c._id), companyName: c.companyName, email: c.email, brNumber: c.brNumber ?? "",
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vehicles: (vehicles as any[]).map((v) => ({
      id: String(v._id), vehicleNumber: v.vehicleNumber, vehicleType: v.vehicleType,
      companyName: v.companyName, vehicleQrId: v.vehicleQrId, currentStatus: v.currentStatus,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    visitors: (visitors as any[]).map((v) => ({
      id: String(v._id), name: v.name, nicNumber: v.nicNumber,
      passId: v.visitorPassId, company: v.company, enteredAt: v.enteredAt, currentStatus: v.currentStatus,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    equipment: (equipment as any[]).map((e) => ({
      id: String(e._id), toolName: e.toolName, equipmentId: e.equipmentId,
      companyName: e.companyName, currentBalance: e.currentBalance, status: e.status,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nonElectricalTools: (nonElectricalTools as any[]).map((t) => ({
      id: String(t._id), toolName: t.toolName, toolId: t.toolId, companyName: t.companyName,
      currentBalance: t.currentBalance, approvedQuantity: t.approvedQuantity, unit: t.unit, status: t.status,
    })),
  });
}
