import Link from "next/link";
import {
  ArrowDownToLine, ArrowUpFromLine, ArrowRight, FileText, History, Users,
  Boxes,
} from "lucide-react";

import { connectDB } from "@/lib/db";
import { ToolMovementModel } from "@/models/ToolMovement";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";

export const dynamic = "force-dynamic";

export default async function InternalSecurityDashboardPage() {
  await connectDB();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [inToday, outToday, gatePassesAgg, activeContractorsAgg, recent] = await Promise.all([
    ToolMovementModel.countDocuments({ direction: "IN",  processedAt: { $gte: startOfDay } }),
    ToolMovementModel.countDocuments({ direction: "OUT", processedAt: { $gte: startOfDay } }),
    ToolMovementModel.aggregate([
      { $match: { processedAt: { $gte: startOfDay } } },
      { $group: { _id: "$gatePassId" } },
      { $count: "n" },
    ]),
    ToolMovementModel.aggregate([
      { $group: { _id: "$contractorId" } },
      { $count: "n" },
    ]),
    ToolMovementModel.find({}).sort({ processedAt: -1 }).limit(20).lean(),
  ]);

  const gatePassesToday = (gatePassesAgg[0] as { n?: number } | undefined)?.n ?? 0;
  const activeContractors = (activeContractorsAgg[0] as { n?: number } | undefined)?.n ?? 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <MotionWrapper>
        <PageHeader
          eyebrow="Internal Security"
          title="Tools Gate Pass Console"
          description="Process tool movements via external gate-pass IDs. All actions are transactional and audit-logged."
          actions={
            <Button asChild className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
              <Link href="/internal-security/gate-pass">
                <FileText className="mr-2 h-4 w-4" /> Process Gate Pass <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />
      </MotionWrapper>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MotionWrapper delay={0.05}>
          <StatsCard icon={ArrowDownToLine} label="Tools IN today" value={inToday} accent="success" />
        </MotionWrapper>
        <MotionWrapper delay={0.08}>
          <StatsCard icon={ArrowUpFromLine} label="Tools OUT today" value={outToday} accent="warning" />
        </MotionWrapper>
        <MotionWrapper delay={0.11}>
          <StatsCard icon={FileText} label="Gate Passes Today" value={gatePassesToday} accent="info" />
        </MotionWrapper>
        <MotionWrapper delay={0.14}>
          <StatsCard icon={Users} label="Active Contractors" value={activeContractors} />
        </MotionWrapper>
      </div>

      <MotionWrapper delay={0.17}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Link href="/internal-security/gate-pass"
                className="rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-lg">
            <FileText className="h-5 w-5 text-[--color-brand-ocean]" />
            <h3 className="mt-3 font-heading font-semibold">Process Gate Pass</h3>
            <p className="mt-1 text-sm text-muted-foreground">Multi-step workflow for moving tools IN or OUT of site.</p>
          </Link>
          <Link href="/internal-security/movements"
                className="rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-lg">
            <History className="h-5 w-5 text-[--color-brand-ocean]" />
            <h3 className="mt-3 font-heading font-semibold">Movement History</h3>
            <p className="mt-1 text-sm text-muted-foreground">Full audit log with filters and export.</p>
          </Link>
          <Link href="/internal-security/contractor-inventory"
                className="rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-lg">
            <Boxes className="h-5 w-5 text-[--color-brand-ocean]" />
            <h3 className="mt-3 font-heading font-semibold">Contractor Inventory</h3>
            <p className="mt-1 text-sm text-muted-foreground">Look up a contractor's tools before processing.</p>
          </Link>
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.2}>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md sm:p-6">
          <h3 className="mb-4 font-heading text-base font-semibold">Recent Movements</h3>
          {recent.length === 0 ? <EmptyState icon={History} title="No movements yet" /> : (
            <div className="overflow-hidden rounded-lg border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead><TableHead>Direction</TableHead>
                    <TableHead>Contractor</TableHead><TableHead>Tool</TableHead>
                    <TableHead>Qty</TableHead><TableHead>Gate Pass</TableHead>
                    <TableHead>Officer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((m) => (
                    <TableRow key={String(m._id)}>
                      <TableCell className="font-mono text-xs">{new Date(m.processedAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</TableCell>
                      <TableCell>
                        <span className={
                          "rounded-md border px-2 py-0.5 text-[11px] font-medium " +
                          (m.direction === "IN"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                            : "border-red-500/30 bg-red-500/10 text-red-600")
                        }>{m.direction}</span>
                      </TableCell>
                      <TableCell>{m.companyName}</TableCell>
                      <TableCell>
                        <div className="font-medium">{m.toolName}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">{m.toolIdentifier}</div>
                      </TableCell>
                      <TableCell>{m.quantity}</TableCell>
                      <TableCell className="font-mono text-xs">{m.gatePassId}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.processedByName}</TableCell>
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
