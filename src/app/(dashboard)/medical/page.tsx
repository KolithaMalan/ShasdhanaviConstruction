import Link from "next/link";
import { Stethoscope, ClipboardList, Ban, ArrowRight, CheckCircle2, XCircle, Clock } from "lucide-react";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";

export const dynamic = "force-dynamic";

export default async function MedicalDashboardPage() {
  await connectDB();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [pending, passedToday, failedToday, total, recent] = await Promise.all([
    EmployeeModel.countDocuments({ status: "PENDING_MEDICAL" }),
    EmployeeModel.countDocuments({ medicalStatus: "PASSED", medicalScreenedAt: { $gte: startOfDay } }),
    EmployeeModel.countDocuments({ medicalStatus: "FAILED", medicalScreenedAt: { $gte: startOfDay } }),
    EmployeeModel.countDocuments({ medicalStatus: { $in: ["PASSED", "FAILED"] } }),
    EmployeeModel.find({ medicalStatus: { $in: ["PASSED", "FAILED"] } })
      .sort({ medicalScreenedAt: -1 })
      .limit(6)
      .lean(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <MotionWrapper>
        <PageHeader
          eyebrow="Medical Officer"
          title="Medical Screening Console"
          description="Screen incoming workforce, record results and protect site safety."
          actions={
            <Button asChild className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
              <Link href="/medical/screening">
                Start Screening <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />
      </MotionWrapper>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MotionWrapper delay={0.05}>
          <StatsCard icon={Clock} label="Pending Medical" value={pending} accent="warning" />
        </MotionWrapper>
        <MotionWrapper delay={0.08}>
          <StatsCard icon={CheckCircle2} label="Passed Today" value={passedToday} accent="success" />
        </MotionWrapper>
        <MotionWrapper delay={0.11}>
          <StatsCard icon={XCircle} label="Failed Today" value={failedToday} accent="danger" />
        </MotionWrapper>
        <MotionWrapper delay={0.14}>
          <StatsCard icon={ClipboardList} label="Total Screened" value={total} accent="info" />
        </MotionWrapper>
      </div>

      <MotionWrapper delay={0.17}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <QuickLink href="/medical/screening" icon={Stethoscope}
                     title="Medical Screening" description="Search by NIC and record screening outcomes." />
          <QuickLink href="/medical/history" icon={ClipboardList}
                     title="Screening History" description="Full audit log of all screening decisions." />
          <QuickLink href="/medical/blacklist" icon={Ban}
                     title="Blacklisted NICs" description="NIC numbers permanently blocked from site access." />
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.2}>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-base font-semibold">Recent Screenings</h3>
            <Link href="/medical/history" className="text-sm font-medium text-[--color-brand-ocean] hover:underline">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState icon={Stethoscope} title="No screenings yet"
                        description="Screening results will appear here as soon as you mark employees." />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>NIC</TableHead>
                    <TableHead>Contractor</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((r) => (
                    <TableRow key={String(r._id)}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="font-mono text-xs">{r.nicNumber}</TableCell>
                      <TableCell>{r.companyName}</TableCell>
                      <TableCell>
                        <span className={
                          "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium " +
                          (r.medicalStatus === "PASSED"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                            : "border-red-500/30 bg-red-500/10 text-red-600")
                        }>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {r.medicalStatus}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.medicalScreenedAt
                          ? new Date(r.medicalScreenedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </MotionWrapper>
    </div>
  );
}

function QuickLink({
  href, icon: Icon, title, description,
}: { href: string; icon: typeof Stethoscope; title: string; description: string }) {
  return (
    <Link href={href}
          className="group rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-lg">
      <Icon className="h-5 w-5 text-foreground" />
      <h3 className="mt-3 font-heading font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
