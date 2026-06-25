import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import { EmployeeModel } from "@/models/Employee";
import { VehicleModel } from "@/models/Vehicle";
import { ElectricalEquipmentModel } from "@/models/ElectricalEquipment";
import { NonElectricalToolModel } from "@/models/NonElectricalTool";
import { requireRole } from "@/lib/api";
import { logAction } from "@/lib/auditLogger";
import { respondReport, parseFormat, type ReportRow } from "@/lib/reportFormatters";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  const format = parseFormat(req);

  await connectDB();
  const contractors = await UserModel.find({ role: "CONTRACTOR" })
    .sort({ companyName: 1 })
    .lean();

  const ids = contractors.map((c) => c._id);
  const [empAgg, vehAgg, elecAgg, nonElecAgg] = await Promise.all([
    EmployeeModel.aggregate([{ $match: { contractorId: { $in: ids } } }, { $group: { _id: "$contractorId", n: { $sum: 1 } } }]),
    VehicleModel.aggregate([{ $match: { contractorId: { $in: ids } } }, { $group: { _id: "$contractorId", n: { $sum: 1 } } }]),
    ElectricalEquipmentModel.aggregate([{ $match: { contractorId: { $in: ids } } }, { $group: { _id: "$contractorId", n: { $sum: 1 } } }]),
    NonElectricalToolModel.aggregate([{ $match: { contractorId: { $in: ids } } }, { $group: { _id: "$contractorId", n: { $sum: 1 } } }]),
  ]);

  const empMap = new Map(empAgg.map((r) => [String(r._id), r.n]));
  const vehMap = new Map(vehAgg.map((r) => [String(r._id), r.n]));
  const elecMap = new Map(elecAgg.map((r) => [String(r._id), r.n]));
  const nonElecMap = new Map(nonElecAgg.map((r) => [String(r._id), r.n]));

  const rows: ReportRow[] = contractors.map((c, i) => {
    const idStr = String(c._id);
    return {
      no: i + 1,
      company: c.companyName ?? c.name,
      email: c.email,
      brNumber: c.brNumber ?? "—",
      status: c.isActive ? "Active" : "Blocked",
      employees: empMap.get(idStr) ?? 0,
      vehicles: vehMap.get(idStr) ?? 0,
      electrical: elecMap.get(idStr) ?? 0,
      nonElectrical: nonElecMap.get(idStr) ?? 0,
    };
  });

  void logAction({
    userId: guard.session.user.id, userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "", userRole: guard.session.user.role,
    action: "DOWNLOAD_REPORT", entityType: "Report",
    description: `Contractor Summary · ${rows.length} contractors (${format})`,
    request: req,
  });

  return respondReport({
    title: "Contractor Summary Report",
    generatedBy: guard.session.user.name ?? undefined,
    columns: [
      { header: "#",            key: "no",            width: "4%",  align: "right" },
      { header: "Company",      key: "company",       width: "26%" },
      { header: "Email",        key: "email",         width: "22%", mono: true },
      { header: "BR No.",       key: "brNumber",      width: "10%", mono: true },
      { header: "Status",       key: "status",        width: "8%" },
      { header: "Employees",    key: "employees",     width: "8%",  align: "right" },
      { header: "Vehicles",     key: "vehicles",      width: "8%",  align: "right" },
      { header: "Electrical",   key: "electrical",    width: "7%",  align: "right" },
      { header: "Non-Elec.",    key: "nonElectrical", width: "7%",  align: "right" },
    ],
    rows,
    summary: [
      { label: "Contractors",     value: rows.length },
      { label: "Total Employees", value: rows.reduce((s, r) => s + Number(r.employees), 0) },
      { label: "Total Vehicles",  value: rows.reduce((s, r) => s + Number(r.vehicles), 0) },
    ],
    orientation: "landscape",
    sheetName: "Contractor Summary",
  }, format);
}
