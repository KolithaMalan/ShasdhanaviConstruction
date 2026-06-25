"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity, ArrowRight, BadgeCheck, BarChart3, Building2, Clock, FileBarChart,
  HardHat, HeartPulse, Loader2, MapPin, RefreshCcw, ScanLine, Settings, ShieldCheck,
  Truck, Users, Wrench,
} from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { CountUpStat } from "@/components/super-admin/CountUpStat";
import {
  OccupancyChart, WeeklyChart, ContractorPieChart, TradeBarChart,
} from "@/components/super-admin/ChartCards";
import { ActivityFeed } from "@/components/super-admin/ActivityFeed";
import { AlertsPanel } from "@/components/super-admin/AlertsPanel";

interface Stats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  currentlyInside: { employees: number; vehicles: number; visitors: number; total: number };
  totalContractors: number;
  todayScans: { total: number; in: number; out: number };
  pending: { registrations: number; additional: number; medical: number; inspections: number; total: number };
  alerts: { expiredIds: number; pendingRegistrations: number; pendingMedical: number; pendingInspections: number };
  systemHealth: { database: string; generatedAt: string };
}

export default function SuperAdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      setRefreshing(true);
      const res = await fetch("/api/super-admin/stats");
      const b = await res.json();
      setStats(b);
    } catch { /* ignore */ }
    finally { setRefreshing(false); }
  }

  useEffect(() => {
    load();
    const t = window.setInterval(load, 60_000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="mx-auto max-w-[1400px] space-y-8">
      {/* Hero command-center header */}
      <MotionWrapper>
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-md">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-[--color-brand-ocean]/30 via-[--color-brand-sky]/15 to-transparent blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gradient-to-tr from-emerald-500/20 to-transparent blur-3xl" />

          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[--color-brand-ocean]">
                Super Administrator
              </p>
              <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                System Command Center
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Real-time overview of the Shasdhanavi Construction Security System.
                Live counts, charts, and audit activity refresh automatically.
              </p>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                {stats ? (
                  <>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                      <span className="font-mono">Database: {stats.systemHealth.database}</span>
                    </span>
                    <span className="font-mono">
                      Last refresh: {new Date(stats.systemHealth.generatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                  </>
                ) : (
                  <Skeleton className="h-4 w-48" />
                )}
              </div>
            </div>
            <Button onClick={load} disabled={refreshing} variant="outline" className="rounded-lg">
              {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              Refresh Data
            </Button>
          </div>
        </div>
      </MotionWrapper>

      {/* Row 1 — Live stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {!stats ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
        ) : (
          <>
            <MotionWrapper delay={0.05}>
              <CountUpStat icon={Users} label="Total Employees" value={stats.totalEmployees}
                           hint={`${stats.activeEmployees} active · ${stats.inactiveEmployees} other`} tone="blue" delay={0} />
            </MotionWrapper>
            <MotionWrapper delay={0.1}>
              <CountUpStat icon={MapPin} label="Currently On Site" value={stats.currentlyInside.total}
                           hint={`Emp ${stats.currentlyInside.employees} · Vis ${stats.currentlyInside.visitors} · Veh ${stats.currentlyInside.vehicles}`}
                           tone="green" delay={0.05} />
            </MotionWrapper>
            <MotionWrapper delay={0.15}>
              <CountUpStat icon={Building2} label="Total Contractors" value={stats.totalContractors}
                           hint="active companies" tone="purple" delay={0.1} />
            </MotionWrapper>
            <MotionWrapper delay={0.2}>
              <CountUpStat icon={ScanLine} label="Today's Scans" value={stats.todayScans.total}
                           hint={`IN ${stats.todayScans.in} · OUT ${stats.todayScans.out}`} tone="orange" delay={0.15} />
            </MotionWrapper>
            <MotionWrapper delay={0.25}>
              <CountUpStat icon={Clock} label="Pending Approvals" value={stats.pending.total}
                           hint={`${stats.pending.registrations} reg · ${stats.pending.additional} addl`} tone="yellow" delay={0.2} />
            </MotionWrapper>
            <MotionWrapper delay={0.3}>
              <CountUpStat icon={HeartPulse} label="System Health" value={stats.alerts.expiredIds === 0 ? 100 : 95}
                           hint={`${stats.alerts.expiredIds} expired IDs`} tone={stats.alerts.expiredIds > 0 ? "rose" : "green"} delay={0.25} />
            </MotionWrapper>
          </>
        )}
      </div>

      {/* Row 2 — Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MotionWrapper delay={0.35}><OccupancyChart /></MotionWrapper>
        <MotionWrapper delay={0.4}><WeeklyChart /></MotionWrapper>
      </div>

      {/* Row 3 — More charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MotionWrapper delay={0.45}><ContractorPieChart /></MotionWrapper>
        <MotionWrapper delay={0.5}><TradeBarChart /></MotionWrapper>
      </div>

      {/* Row 4 — Activity + Alerts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <MotionWrapper delay={0.55} className="lg:col-span-3"><ActivityFeed /></MotionWrapper>
        <MotionWrapper delay={0.6} className="lg:col-span-2"><AlertsPanel alerts={stats?.alerts ?? null} /></MotionWrapper>
      </div>

      {/* Row 5 — Quick access */}
      <MotionWrapper delay={0.65}>
        <h3 className="mb-3 font-heading text-base font-semibold">Quick Access</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Quick href="/super-admin/users"        icon={Users}        label="User Management" />
          <Quick href="/super-admin/contractors"  icon={Building2}    label="All Contractors" />
          <Quick href="/super-admin/employees"    icon={HardHat}      label="All Employees" />
          <Quick href="/super-admin/vehicles"     icon={Truck}        label="All Vehicles" />
          <Quick href="/super-admin/equipment"    icon={Wrench}       label="All Equipment" />
          <Quick href="/super-admin/reports"      icon={FileBarChart} label="Reports Center" />
          <Quick href="/super-admin/settings"     icon={Settings}     label="System Settings" />
          <Quick href="/super-admin/audit-log"    icon={Activity}     label="Audit Log" />
        </div>
      </MotionWrapper>

      {/* Stash some icons used elsewhere */}
      <span className="hidden"><BadgeCheck /><BarChart3 /><ShieldCheck /><ArrowRight /></span>
    </div>
  );
}

function Quick({ href, icon: Icon, label }: { href: string; icon: typeof Users; label: string }) {
  return (
    <Link href={href}
          className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-[--color-brand-ocean]/40 hover:shadow-lg">
      <span className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-[--color-brand-ocean]/15 to-transparent blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />
      <Icon className="relative h-5 w-5 text-[--color-brand-ocean]" />
      <div className="relative mt-3 text-sm font-medium">{label}</div>
      <div className="relative mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        Open →
      </div>
    </Link>
  );
}
