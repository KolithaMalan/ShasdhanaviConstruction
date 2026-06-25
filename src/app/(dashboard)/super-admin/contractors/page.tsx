import Link from "next/link";
import { Building2, Mail, Truck, Users, Wrench } from "lucide-react";

import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import { EmployeeModel } from "@/models/Employee";
import { VehicleModel } from "@/models/Vehicle";
import { ElectricalEquipmentModel } from "@/models/ElectricalEquipment";
import { NonElectricalToolModel } from "@/models/NonElectricalTool";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function SuperAdminContractorsPage() {
  await connectDB();
  const contractors = await UserModel.find({ role: "CONTRACTOR" })
    .sort({ companyName: 1 }).lean();

  const ids = contractors.map((c) => c._id);
  const [emp, veh, elec, ne] = await Promise.all([
    EmployeeModel.aggregate([{ $match: { contractorId: { $in: ids } } }, { $group: { _id: "$contractorId", n: { $sum: 1 } } }]),
    VehicleModel.aggregate([{ $match: { contractorId: { $in: ids } } }, { $group: { _id: "$contractorId", n: { $sum: 1 } } }]),
    ElectricalEquipmentModel.aggregate([{ $match: { contractorId: { $in: ids } } }, { $group: { _id: "$contractorId", n: { $sum: 1 } } }]),
    NonElectricalToolModel.aggregate([{ $match: { contractorId: { $in: ids } } }, { $group: { _id: "$contractorId", n: { $sum: 1 } } }]),
  ]);
  const mapOf = (arr: { _id: unknown; n: number }[]) => new Map(arr.map((r) => [String(r._id), r.n]));
  const eM = mapOf(emp), vM = mapOf(veh), elM = mapOf(elec), neM = mapOf(ne);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Super Admin"
          title="All Contractors"
          description="Every contractor company across the platform."
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        {contractors.length === 0 ? <EmptyState icon={Building2} title="No contractors" /> : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>BR Number</TableHead>
                  <TableHead className="text-center"><Users className="mr-1 inline h-3.5 w-3.5" />Employees</TableHead>
                  <TableHead className="text-center"><Truck className="mr-1 inline h-3.5 w-3.5" />Vehicles</TableHead>
                  <TableHead className="text-center"><Wrench className="mr-1 inline h-3.5 w-3.5" />Tools</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contractors.map((c) => {
                  const id = String(c._id);
                  return (
                    <TableRow key={id}>
                      <TableCell>
                        <Link href={`/admin/registrations`} className="block">
                          <div className="font-medium">{c.companyName ?? c.name}</div>
                          {c.brNumber && <div className="font-mono text-[11px] text-muted-foreground">{c.brNumber}</div>}
                        </Link>
                      </TableCell>
                      <TableCell><span className="inline-flex items-center gap-1.5 font-mono text-xs">
                        <Mail className="h-3 w-3 text-muted-foreground" /> {c.email}
                      </span></TableCell>
                      <TableCell className="font-mono text-xs">{c.brNumber || "—"}</TableCell>
                      <TableCell className="text-center font-mono">{eM.get(id) ?? 0}</TableCell>
                      <TableCell className="text-center font-mono">{vM.get(id) ?? 0}</TableCell>
                      <TableCell className="text-center font-mono">
                        {(elM.get(id) ?? 0) + (neM.get(id) ?? 0)}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          "rounded-md " + (c.isActive
                            ? "bg-emerald-500/15 text-emerald-600"
                            : "bg-red-500/15 text-red-600")
                        }>{c.isActive ? "Active" : "Blocked"}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </MotionWrapper>
    </div>
  );
}
