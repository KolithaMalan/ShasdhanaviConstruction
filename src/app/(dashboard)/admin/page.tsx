import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  PlusCircle,
} from "lucide-react";

import { connectDB } from "@/lib/db";
import { ContractorRegistrationModel } from "@/models/ContractorRegistration";
import { AdditionalRequestModel } from "@/models/AdditionalRequest";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { AdminDashboardTabs } from "@/components/admin/AdminDashboardTabs";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await connectDB();

  const [total, pending, approved, rejected, recent, addlPending] = await Promise.all([
    ContractorRegistrationModel.countDocuments({}),
    ContractorRegistrationModel.countDocuments({ status: "PENDING" }),
    ContractorRegistrationModel.countDocuments({ status: "APPROVED" }),
    ContractorRegistrationModel.countDocuments({ status: "REJECTED" }),
    ContractorRegistrationModel.find({}).sort({ submittedAt: -1 }).limit(6).lean(),
    AdditionalRequestModel.countDocuments({ status: "PENDING" }),
  ]);

  /* The previous main dashboard — now the second ("Operations") tab. */
  const operations = (
    <div className="space-y-8">
      <MotionWrapper>
        <PageHeader
          eyebrow="Admin · HSEQ"
          title="Operational Administration"
          description="Review contractor registrations, additional requests, and onboard new contractor accounts."
          actions={
            <Button asChild className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
              <Link href="/admin/registrations">
                Open Registrations <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />
      </MotionWrapper>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MotionWrapper delay={0.05}>
          <StatsCard icon={FileText} label="Total Registrations" value={total} />
        </MotionWrapper>
        <MotionWrapper delay={0.08}>
          <StatsCard icon={Clock} label="Pending" value={pending} accent="warning" hint="Awaiting review" />
        </MotionWrapper>
        <MotionWrapper delay={0.11}>
          <StatsCard icon={CheckCircle2} label="Approved" value={approved} accent="success" />
        </MotionWrapper>
        <MotionWrapper delay={0.14}>
          <StatsCard icon={XCircle} label="Rejected" value={rejected} accent="danger" />
        </MotionWrapper>
      </div>

      <MotionWrapper delay={0.17}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Link
            href="/admin/registrations"
            className="group rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-lg"
          >
            <FileText className="h-5 w-5 text-foreground" />
            <h3 className="mt-3 font-heading font-semibold">Contractor Registrations</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              View, approve or reject pending contractor registration requests.
            </p>
          </Link>
          <Link
            href="/admin/additional-requests"
            className="group rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-lg"
          >
            <PlusCircle className="h-5 w-5 text-foreground" />
            <h3 className="mt-3 font-heading font-semibold">
              Additional Requests
              {addlPending > 0 && (
                <span className="ml-2 inline-block rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-500">
                  {addlPending} pending
                </span>
              )}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Approve additional labour, vehicles, or equipment for existing contractors.
            </p>
          </Link>
          <div className="rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-md">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <h3 className="mt-3 font-heading font-semibold">Approval Workflow</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Approving a registration unlocks the account creation step — the contractor
              receives their login credentials by email.
            </p>
          </div>
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.2}>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-base font-semibold">Recent Registrations</h3>
            <Link
              href="/admin/registrations"
              className="text-sm font-medium text-[--color-brand-ocean] hover:underline"
            >
              View all
            </Link>
          </div>

          {recent.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No registrations yet"
              description="Submitted contractor registrations will appear here."
            />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead aria-label="open" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((r) => (
                    <TableRow key={String(r._id)}>
                      <TableCell>
                        <div className="font-medium">{r.companyName}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">{r.email}</div>
                      </TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.submittedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/admin/registrations/${String(r._id)}`}
                          className="text-sm font-medium text-[--color-brand-ocean] hover:underline"
                        >
                          Open
                        </Link>
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

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Admin · HSEQ"
          title="Site Command Center"
          description="Live overview of everyone on site, attendance, vehicles, tools and contractors."
        />
      </MotionWrapper>

      <AdminDashboardTabs operationsSlot={operations} />
    </div>
  );
}
