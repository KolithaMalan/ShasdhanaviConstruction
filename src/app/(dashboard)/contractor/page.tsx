import Link from "next/link";
import {
  Users, Truck, Wrench, Inbox, Activity, FileDown,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
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

export const dynamic = "force-dynamic";

export default async function ContractorHomePage() {
  const session = await auth();
  await connectDB();

  const user = await UserModel.findById(session?.user?.id).lean();
  const reg = user?.registrationId
    ? await ContractorRegistrationModel.findById(user.registrationId).lean()
    : null;
  const recentRequests = user
    ? await AdditionalRequestModel.find({ contractorId: user._id })
        .sort({ submittedAt: -1 })
        .limit(5)
        .lean()
    : [];

  const employees = reg?.labourList.length ?? 0;
  const vehicles = reg?.vehicles.length ?? 0;
  const equip = (reg?.electricalEquipment.length ?? 0) + (reg?.nonElectricalTools.length ?? 0);
  const pendingReqs = await (user
    ? AdditionalRequestModel.countDocuments({ contractorId: user._id, status: "PENDING" })
    : Promise.resolve(0));

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <MotionWrapper>
        <PageHeader
          eyebrow="Contractor"
          title={`Welcome, ${user?.companyName ?? user?.name ?? "Contractor"}`}
          description="Manage your workforce, vehicles, equipment and gate-pass requests."
          actions={
            <Button asChild className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
              <Link href="/contractor/requests">My Requests</Link>
            </Button>
          }
        />
      </MotionWrapper>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MotionWrapper delay={0.05}>
          <StatsCard icon={Users} label="Employees" value={employees} accent="info" />
        </MotionWrapper>
        <MotionWrapper delay={0.08}>
          <StatsCard icon={Truck} label="Vehicles" value={vehicles} />
        </MotionWrapper>
        <MotionWrapper delay={0.11}>
          <StatsCard icon={Wrench} label="Equipment & Tools" value={equip} />
        </MotionWrapper>
        <MotionWrapper delay={0.14}>
          <StatsCard icon={Inbox} label="Pending Requests" value={pendingReqs} accent="warning" />
        </MotionWrapper>
      </div>

      <MotionWrapper delay={0.17}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <QuickLink href="/contractor/employees" icon={Users} title="My Employees"
                     description="View your workforce and submit additional employee requests." />
          <QuickLink href="/contractor/vehicles" icon={Truck} title="My Vehicles"
                     description="View vehicles registered for site access." />
          <QuickLink href="/contractor/movement-history" icon={Activity} title="Movement History"
                     description="IN/OUT history once gate scanning goes live." />
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.2}>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-base font-semibold">Recent Activity</h3>
            <Link href="/contractor/requests" className="text-sm font-medium text-[--color-brand-ocean] hover:underline">
              View all
            </Link>
          </div>

          {recentRequests.length === 0 ? (
            <EmptyState
              icon={FileDown}
              title="No additional requests yet"
              description="Use the buttons in each section to request more employees, vehicles or equipment."
            />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRequests.map((r) => (
                    <TableRow key={String(r._id)}>
                      <TableCell className="font-medium">
                        {r.requestType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                      </TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.submittedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
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
}: {
  href: string; icon: typeof Users; title: string; description: string;
}) {
  return (
    <Link href={href}
          className="group rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-lg">
      <Icon className="h-5 w-5 text-foreground" />
      <h3 className="mt-3 font-heading font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
