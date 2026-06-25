"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Activity, Users, Truck, IdCard, ScanLine, Clock,
} from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { StatsCard } from "@/components/shared/StatsCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  scansToday: number;
  inToday: number;
  outToday: number;
  insideTotals: { all: number; employees: number; vehicles: number; visitors: number };
}
interface EmployeeRow { id: string; name: string; employeeId?: string | null; nicNumber: string; companyName: string; tradeType: string; lastScanAt: string }
interface VisitorRow { id: string; passId: string; name: string; nicNumber: string; company: string; purpose: string; contactPerson: string; enteredAt: string }
interface VehicleRow { id: string; vehicleNumber: string; vehicleType: string; companyName: string; lastScanAt: string }
interface RecentRow {
  id: string; entityType: "EMPLOYEE" | "VISITOR" | "VEHICLE";
  entityName: string; entityIdentifier: string; companyName?: string;
  direction: "IN" | "OUT"; gateLocation: string; scannedAt: string; scannedByName: string; scanMethod: string;
}

export default function SecurityDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [employees, setEmployees] = useState<EmployeeRow[] | null>(null);
  const [visitors, setVisitors] = useState<VisitorRow[] | null>(null);
  const [vehicles, setVehicles] = useState<VehicleRow[] | null>(null);
  const [recent, setRecent] = useState<RecentRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [s, e, vis, veh, r] = await Promise.all([
          fetch("/api/security/stats").then((r) => r.json()),
          fetch("/api/security/currently-inside?type=EMPLOYEE").then((r) => r.json()),
          fetch("/api/security/currently-inside?type=VISITOR").then((r) => r.json()),
          fetch("/api/security/currently-inside?type=VEHICLE").then((r) => r.json()),
          fetch("/api/security/recent-scans?limit=50").then((r) => r.json()),
        ]);
        if (cancelled) return;
        setStats(s);
        setEmployees(e.items ?? []);
        setVisitors(vis.items ?? []);
        setVehicles(veh.items ?? []);
        setRecent(r.items ?? []);
      } catch { /* ignore */ }
    }
    load();
    const t = window.setInterval(load, 30_000);
    return () => { cancelled = true; window.clearInterval(t); };
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <MotionWrapper>
        <PageHeader
          eyebrow="Security Officer"
          title="Live Dashboard"
          description="Real-time site occupancy and recent scan activity. Auto-refreshes every 30 seconds."
          actions={
            <Button asChild className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
              <Link href="/security">
                <ScanLine className="mr-2 h-4 w-4" /> Open Scan Workstation <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />
      </MotionWrapper>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MotionWrapper delay={0.05}>
          <StatsCard icon={Users} label="Inside Site" value={stats?.insideTotals.all ?? 0} accent="success" hint="employees + visitors + vehicles" />
        </MotionWrapper>
        <MotionWrapper delay={0.08}>
          <StatsCard icon={ScanLine} label="Scans Today" value={stats?.scansToday ?? 0} accent="info" />
        </MotionWrapper>
        <MotionWrapper delay={0.11}>
          <StatsCard icon={IdCard} label="Visitors Inside" value={stats?.insideTotals.visitors ?? 0} accent="warning" />
        </MotionWrapper>
        <MotionWrapper delay={0.14}>
          <StatsCard icon={Truck} label="Vehicles Inside" value={stats?.insideTotals.vehicles ?? 0} />
        </MotionWrapper>
      </div>

      <MotionWrapper delay={0.17}>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md sm:p-6">
          <h3 className="mb-4 font-heading text-base font-semibold">Currently Inside</h3>
          <Tabs defaultValue="employees">
            <TabsList>
              <TabsTrigger value="employees">Employees ({stats?.insideTotals.employees ?? 0})</TabsTrigger>
              <TabsTrigger value="visitors">Visitors ({stats?.insideTotals.visitors ?? 0})</TabsTrigger>
              <TabsTrigger value="vehicles">Vehicles ({stats?.insideTotals.vehicles ?? 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="employees" className="mt-4">
              {employees === null ? <Skeleton className="h-48 w-full" /> :
               employees.length === 0 ? <EmptyState icon={Users} title="No employees inside" /> : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Name</TableHead><TableHead>Employee ID</TableHead>
                    <TableHead>NIC</TableHead><TableHead>Contractor</TableHead>
                    <TableHead>Trade</TableHead><TableHead>Since</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {employees.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.name}</TableCell>
                        <TableCell className="font-mono text-xs">{e.employeeId ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{e.nicNumber}</TableCell>
                        <TableCell>{e.companyName}</TableCell>
                        <TableCell>{e.tradeType}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{e.lastScanAt ? new Date(e.lastScanAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="visitors" className="mt-4">
              {visitors === null ? <Skeleton className="h-48 w-full" /> :
               visitors.length === 0 ? <EmptyState icon={IdCard} title="No visitors inside" /> : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Pass</TableHead><TableHead>Name</TableHead><TableHead>NIC</TableHead>
                    <TableHead>Company</TableHead><TableHead>Purpose</TableHead>
                    <TableHead>Contact</TableHead><TableHead>Since</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {visitors.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-mono text-xs">{v.passId}</TableCell>
                        <TableCell className="font-medium">{v.name}</TableCell>
                        <TableCell className="font-mono text-xs">{v.nicNumber}</TableCell>
                        <TableCell>{v.company || "—"}</TableCell>
                        <TableCell className="max-w-50 truncate">{v.purpose || "—"}</TableCell>
                        <TableCell>{v.contactPerson || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(v.enteredAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="vehicles" className="mt-4">
              {vehicles === null ? <Skeleton className="h-48 w-full" /> :
               vehicles.length === 0 ? <EmptyState icon={Truck} title="No vehicles inside" /> : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Number</TableHead><TableHead>Type</TableHead>
                    <TableHead>Contractor</TableHead><TableHead>Since</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {vehicles.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.vehicleNumber}</TableCell>
                        <TableCell>{v.vehicleType}</TableCell>
                        <TableCell>{v.companyName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{v.lastScanAt ? new Date(v.lastScanAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.2}>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-base font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-[--color-brand-ocean]" /> Recent Scans
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <Clock className="mr-1 inline h-3 w-3" /> auto-refreshes
            </span>
          </div>
          {recent === null ? <Skeleton className="h-64 w-full" /> :
           recent.length === 0 ? <EmptyState icon={Activity} title="No recent scans" /> : (
            <div className="overflow-hidden rounded-lg border border-border/60">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Time</TableHead><TableHead>Type</TableHead>
                  <TableHead>Name</TableHead><TableHead>Identifier</TableHead>
                  <TableHead>Direction</TableHead><TableHead>Gate</TableHead>
                  <TableHead>Officer</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {recent.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{new Date(r.scannedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</TableCell>
                      <TableCell><span className="rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider">{r.entityType}</span></TableCell>
                      <TableCell className="font-medium">{r.entityName}</TableCell>
                      <TableCell className="font-mono text-xs">{r.entityIdentifier}</TableCell>
                      <TableCell>
                        <span className={
                          "rounded-md border px-2 py-0.5 text-[11px] font-medium " +
                          (r.direction === "IN"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                            : "border-red-500/30 bg-red-500/10 text-red-600")
                        }>{r.direction}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.gateLocation}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.scannedByName}</TableCell>
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
