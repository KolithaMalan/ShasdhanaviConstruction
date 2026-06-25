"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";

import { Skeleton } from "@/components/ui/skeleton";

const TICK_COLOR = "rgba(170,170,190,0.6)";
const GRID_COLOR = "rgba(255,255,255,0.06)";

interface OccupancyItem { hour: string; employees: number; vehicles: number; visitors: number }
interface WeeklyItem { date: string; in: number; out: number }
interface ContractorItem { company: string; count: number }
interface TradeItem { trade: string; count: number }

const PALETTE = ["#146C94", "#7FC7D9", "#10B981", "#F59E0B", "#A1C2BD", "#475569", "#EC4899", "#0EA5E9", "#22C55E", "#FB923C", "#94A3B8"];

function CustomTooltip({ active, payload, label }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  active?: boolean; payload?: any[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-card/90 px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
      {label && <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>}
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-mono font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function OccupancyChart() {
  const [data, setData] = useState<OccupancyItem[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/super-admin/charts/occupancy");
        const b = await res.json();
        if (!cancelled) setData(b.items ?? []);
      } catch { /* ignore */ }
    }
    load();
    const t = window.setInterval(load, 60_000);
    return () => { cancelled = true; window.clearInterval(t); };
  }, []);

  return (
    <ChartCard title="Live Site Occupancy" subtitle="Hourly snapshot · refreshes each minute">
      {data === null ? <Skeleton className="h-64 w-full" /> : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="empFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#146C94" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#146C94" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="visFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="vehFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="hour" tick={{ fill: TICK_COLOR, fontSize: 10 }} stroke={GRID_COLOR} />
            <YAxis tick={{ fill: TICK_COLOR, fontSize: 10 }} stroke={GRID_COLOR} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="employees" name="Employees" stroke="#146C94" fill="url(#empFill)" strokeWidth={2} />
            <Area type="monotone" dataKey="vehicles"  name="Vehicles"  stroke="#10B981" fill="url(#vehFill)" strokeWidth={2} />
            <Area type="monotone" dataKey="visitors"  name="Visitors"  stroke="#F59E0B" fill="url(#visFill)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function WeeklyChart() {
  const [data, setData] = useState<WeeklyItem[] | null>(null);
  useEffect(() => {
    fetch("/api/super-admin/charts/weekly")
      .then((r) => r.json())
      .then((b) => setData(b.items ?? []))
      .catch(() => setData([]));
  }, []);

  return (
    <ChartCard title="Weekly Movement Trends" subtitle="Daily IN vs OUT — last 7 days">
      {data === null ? <Skeleton className="h-64 w-full" /> : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickFormatter={(d: string) => new Date(d).toLocaleDateString("en-GB", { weekday: "short" })}
                   tick={{ fill: TICK_COLOR, fontSize: 10 }} stroke={GRID_COLOR} />
            <YAxis tick={{ fill: TICK_COLOR, fontSize: 10 }} stroke={GRID_COLOR} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="in"  name="IN"  fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={36} />
            <Bar dataKey="out" name="OUT" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function ContractorPieChart() {
  const [data, setData] = useState<ContractorItem[] | null>(null);
  useEffect(() => {
    fetch("/api/super-admin/charts/contractors")
      .then((r) => r.json())
      .then((b) => setData(b.items ?? []))
      .catch(() => setData([]));
  }, []);

  return (
    <ChartCard title="Contractor Distribution" subtitle="Employee count per contractor · top 10">
      {data === null ? <Skeleton className="h-64 w-full" /> :
       data.length === 0 ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="company" innerRadius={50} outerRadius={90} paddingAngle={2}>
              {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} layout="vertical" verticalAlign="middle" align="right" />
          </PieChart>
        </ResponsiveContainer>
       )}
    </ChartCard>
  );
}

export function TradeBarChart() {
  const [data, setData] = useState<TradeItem[] | null>(null);
  useEffect(() => {
    fetch("/api/super-admin/charts/trades")
      .then((r) => r.json())
      .then((b) => setData(b.items ?? []))
      .catch(() => setData([]));
  }, []);

  return (
    <ChartCard title="Trade Distribution" subtitle="Employees grouped by trade type">
      {data === null ? <Skeleton className="h-64 w-full" /> :
       data.length === 0 ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} layout="vertical" margin={{ left: 6, right: 12 }}>
            <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fill: TICK_COLOR, fontSize: 10 }} stroke={GRID_COLOR} />
            <YAxis dataKey="trade" type="category" width={100} tick={{ fill: TICK_COLOR, fontSize: 10 }} stroke={GRID_COLOR} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Employees" fill="#146C94" radius={[0, 4, 4, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
       )}
    </ChartCard>
  );
}

function ChartCard({
  title, subtitle, children,
}: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md">
      <div className="mb-4">
        <h3 className="font-heading text-base font-semibold">{title}</h3>
        {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
      No data to display yet
    </div>
  );
}
