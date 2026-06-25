import Link from "next/link";
import {
  Activity, ArrowRight, BadgeCheck, ClipboardCheck, Clock, Users,
  Zap, ShieldAlert, CheckCircle2, XCircle,
} from "lucide-react";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { ElectricalEquipmentModel } from "@/models/ElectricalEquipment";
import { checkExpiredIdCards } from "@/lib/idCardChecker";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";

export const dynamic = "force-dynamic";

export default async function HseqDashboardPage() {
  await connectDB();
  await checkExpiredIdCards();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const inSevenDays = new Date();
  inSevenDays.setDate(inSevenDays.getDate() + 7);

  const [
    awaiting, inductedToday, totalActive, expiringSoon,
    pendingElectrical, passedToday, failedToday, equipmentBlocked,
    recentInductions, recentInspections,
  ] = await Promise.all([
    EmployeeModel.countDocuments({ status: "MEDICAL_PASSED" }),
    EmployeeModel.countDocuments({ inductionCompletedAt: { $gte: startOfDay } }),
    EmployeeModel.countDocuments({ status: "ACTIVE" }),
    EmployeeModel.countDocuments({
      status: "ACTIVE",
      idCardExpiresAt: { $gte: new Date(), $lte: inSevenDays },
    }),
    ElectricalEquipmentModel.countDocuments({ inspectionStatus: "PENDING_INSPECTION" }),
    ElectricalEquipmentModel.countDocuments({ inspectionStatus: "PASSED", inspectedAt: { $gte: startOfDay } }),
    ElectricalEquipmentModel.countDocuments({ inspectionStatus: "FAILED", inspectedAt: { $gte: startOfDay } }),
    ElectricalEquipmentModel.countDocuments({ status: "BLOCKED" }),
    EmployeeModel.find({ inductionCompletedAt: { $ne: null } })
      .sort({ inductionCompletedAt: -1 }).limit(5).lean(),
    ElectricalEquipmentModel.find({ inspectionStatus: { $in: ["PASSED", "FAILED"] } })
      .sort({ inspectedAt: -1 }).limit(5).lean(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <MotionWrapper>
        <PageHeader
          eyebrow="HSEQ Officer"
          title="HSEQ Console"
          description="Induct workforce, inspect contractor electrical equipment, and issue site clearance."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" className="rounded-lg">
                <Link href="/hseq/electrical-inspection">
                  <Zap className="mr-2 h-4 w-4" /> Electrical Inspection
                </Link>
              </Button>
              <Button asChild className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
                <Link href="/hseq/induction">
                  Induction <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          }
        />
      </MotionWrapper>

      {/* Induction stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MotionWrapper delay={0.05}>
          <StatsCard icon={Clock} label="Awaiting Induction" value={awaiting} accent="info" />
        </MotionWrapper>
        <MotionWrapper delay={0.08}>
          <StatsCard icon={ClipboardCheck} label="Inducted Today" value={inductedToday} accent="success" />
        </MotionWrapper>
        <MotionWrapper delay={0.11}>
          <StatsCard icon={BadgeCheck} label="Active IDs" value={totalActive} />
        </MotionWrapper>
        <MotionWrapper delay={0.14}>
          <StatsCard icon={Activity} label="Expiring Soon (7d)" value={expiringSoon} accent="warning" />
        </MotionWrapper>
      </div>

      {/* Electrical inspection stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MotionWrapper delay={0.17}>
          <StatsCard icon={Zap} label="Pending Inspections" value={pendingElectrical} accent="warning" />
        </MotionWrapper>
        <MotionWrapper delay={0.2}>
          <StatsCard icon={CheckCircle2} label="Passed Today" value={passedToday} accent="success" />
        </MotionWrapper>
        <MotionWrapper delay={0.23}>
          <StatsCard icon={XCircle} label="Failed Today" value={failedToday} accent="danger" />
        </MotionWrapper>
        <MotionWrapper delay={0.26}>
          <StatsCard icon={ShieldAlert} label="Equipment Blocked" value={equipmentBlocked} accent="danger" />
        </MotionWrapper>
      </div>

      <MotionWrapper delay={0.3}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-base font-semibold">Recent Inductions</h3>
              <Link href="/hseq/inducted-employees" className="text-sm font-medium text-[--color-brand-ocean] hover:underline">View all</Link>
            </div>
            {recentInductions.length === 0 ? (
              <EmptyState icon={Users} title="No inductions yet" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead><TableHead>Employee ID</TableHead><TableHead>Inducted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInductions.map((r) => (
                    <TableRow key={String(r._id)}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="font-mono text-xs">{r.employeeId}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.inductionCompletedAt ? new Date(r.inductionCompletedAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-base font-semibold">Recent Inspections</h3>
              <Link href="/hseq/inspection-history" className="text-sm font-medium text-[--color-brand-ocean] hover:underline">View all</Link>
            </div>
            {recentInspections.length === 0 ? (
              <EmptyState icon={Zap} title="No inspections yet" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tool</TableHead><TableHead>Status</TableHead><TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInspections.map((r) => (
                    <TableRow key={String(r._id)}>
                      <TableCell>
                        <div className="font-medium">{r.toolName}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">{r.equipmentId}</div>
                      </TableCell>
                      <TableCell>
                        <span className={
                          "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium " +
                          (r.inspectionStatus === "PASSED"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                            : "border-red-500/30 bg-red-500/10 text-red-600")
                        }>{r.inspectionStatus}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.inspectedAt ? new Date(r.inspectedAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </MotionWrapper>
    </div>
  );
}
