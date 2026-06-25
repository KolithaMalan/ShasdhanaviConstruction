"use client";

import { useState } from "react";
import {
  Activity, ClipboardCheck, Clock, Download, FileBarChart, FileSpreadsheet,
  HardHat, Loader2, Stethoscope, Truck, Users, Wrench, Zap,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface ReportDef {
  id: string;
  title: string;
  description: string;
  icon: typeof Activity;
  endpoint: string;
  category: "attendance" | "contractor" | "equipment" | "hr";
  fields?: ("dateRange" | "singleDate" | "contractor")[];
}

const REPORTS: ReportDef[] = [
  { id: "daily-attendance",      title: "Daily Attendance",        description: "First IN / last OUT per employee for a given day.", icon: ClipboardCheck, endpoint: "/api/reports/daily-attendance",      category: "attendance", fields: ["singleDate"] },
  { id: "working-days",          title: "Working Days",            description: "Unique IN-days per employee for salary calc.",      icon: Clock,         endpoint: "/api/reports/working-days",          category: "attendance", fields: ["dateRange"] },
  { id: "movement-log",          title: "Movement Log",            description: "Every IN/OUT scan in the given range.",             icon: Activity,      endpoint: "/api/reports/movement-log",          category: "attendance", fields: ["dateRange"] },
  { id: "contractor-summary",    title: "Contractor Summary",      description: "Headline counts per contractor.",                    icon: Users,         endpoint: "/api/reports/contractor-summary",    category: "contractor" },
  { id: "equipment-inventory",   title: "Equipment Inventory",     description: "Electrical + non-electrical inventory dump.",       icon: Wrench,        endpoint: "/api/reports/equipment-inventory",   category: "equipment" },
  { id: "electrical-inspections",title: "Electrical Inspections",  description: "Pass/fail electrical inspections in range.",        icon: Zap,           endpoint: "/api/reports/electrical-inspections",category: "equipment", fields: ["dateRange"] },
  { id: "medical-screenings",    title: "Medical Screenings",      description: "Pass/fail medical screenings.",                     icon: Stethoscope,   endpoint: "/api/reports/medical-screenings",    category: "hr",         fields: ["dateRange"] },
  { id: "expired-ids",           title: "Expired ID Cards",        description: "Employees with currently expired/deactivated IDs.", icon: HardHat,       endpoint: "/api/reports/expired-ids",           category: "hr" },
];

const CATEGORIES = [
  { id: "attendance", label: "Attendance & Movement" },
  { id: "contractor", label: "Contractor" },
  { id: "equipment",  label: "Equipment" },
  { id: "hr",         label: "HR & Safety" },
] as const;

export function ReportsHub() {
  const [active, setActive] = useState<ReportDef | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Reports"
          title="Reports Center"
          description="Generate official reports — preview in-browser or download as PDF / Excel."
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <Tabs defaultValue="attendance">
          <TabsList>
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c.id} value={c.id}>{c.label}</TabsTrigger>
            ))}
          </TabsList>
          {CATEGORIES.map((c) => (
            <TabsContent key={c.id} value={c.id} className="mt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {REPORTS.filter((r) => r.category === c.id).map((r) => (
                  <ReportCard key={r.id} def={r}
                              onPreview={() => { setActive(r); setShowPreview(true); }}
                              onPicked={(def) => setActive(def)} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </MotionWrapper>

      {active && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>{active.title} — preview</DialogTitle>
            </DialogHeader>
            <ReportPreview def={active} />
          </DialogContent>
        </Dialog>
      )}

      {/* unused icon kept to keep tree-shake friendly */}
      <FileBarChart className="hidden" />
    </div>
  );
}

function ReportCard({
  def, onPreview, onPicked,
}: { def: ReportDef; onPreview: () => void; onPicked: (d: ReportDef) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [start, setStart] = useState(monthAgo);
  const [end, setEnd] = useState(today);
  const [single, setSingle] = useState(today);
  const [busyKey, setBusyKey] = useState<"pdf" | "excel" | "preview" | null>(null);

  const fields = def.fields ?? [];

  function buildUrl(format: "pdf" | "excel" | "json") {
    const params = new URLSearchParams({ format });
    if (fields.includes("dateRange")) { params.set("startDate", start); params.set("endDate", end); }
    if (fields.includes("singleDate")) params.set("date", single);
    return `${def.endpoint}?${params.toString()}`;
  }

  async function download(format: "pdf" | "excel") {
    setBusyKey(format);
    try {
      const res = await fetch(buildUrl(format));
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${def.id}.${format === "pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success(`${def.title} downloaded`);
    } catch { toast.error("Download failed"); }
    finally { setBusyKey(null); }
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-[--color-brand-ocean]/40 hover:shadow-xl">
      <span className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-[--color-brand-ocean]/15 to-transparent blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[--color-brand-ocean]/15 text-[--color-brand-ocean]">
          <def.icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading font-semibold">{def.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{def.description}</p>
        </div>
      </div>

      {(fields.includes("dateRange") || fields.includes("singleDate")) && (
        <div className="relative mt-3 grid grid-cols-2 gap-2">
          {fields.includes("singleDate") && (
            <div className="col-span-2 space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Date</Label>
              <Input type="date" value={single} onChange={(e) => setSingle(e.target.value)} className="h-9" />
            </div>
          )}
          {fields.includes("dateRange") && (
            <>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">From</Label>
                <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">To</Label>
                <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="h-9" />
              </div>
            </>
          )}
        </div>
      )}

      <div className="relative mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline"
                onClick={() => { onPicked(def); onPreview(); }}
                className="rounded-lg">
          Preview
        </Button>
        <Button size="sm" variant="outline"
                onClick={() => download("pdf")}
                disabled={busyKey === "pdf"}
                className="rounded-lg">
          {busyKey === "pdf" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1.5 h-3.5 w-3.5" />}
          PDF
        </Button>
        <Button size="sm"
                onClick={() => download("excel")}
                disabled={busyKey === "excel"}
                className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
          {busyKey === "excel" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />}
          Excel
        </Button>
      </div>
      {/* unused icon - keep import alive */}
      <Truck className="hidden" />
    </div>
  );
}

function ReportPreview({ def }: { def: ReportDef }) {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const fields = def.fields ?? [];
  const params = new URLSearchParams({ format: "json" });
  if (fields.includes("dateRange")) { params.set("startDate", monthAgo); params.set("endDate", today); }
  if (fields.includes("singleDate")) params.set("date", today);

  if (data === null) {
    fetch(`${def.endpoint}?${params}`)
      .then((r) => r.json())
      .then((b) => setData(b))
      .catch(() => setData({ rows: [], columns: [] }));
    return <div className="flex h-48 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  return (
    <div className="space-y-3">
      {data.subtitle && <p className="text-xs text-muted-foreground">{data.subtitle}</p>}
      <div className="max-h-[60vh] overflow-auto rounded-lg border border-border/60">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-card/95 backdrop-blur">
            <tr>
              {(data.columns ?? []).map((c: { header: string; key: string }) => (
                <th key={c.key} className="px-3 py-2 text-left font-mono uppercase tracking-wider text-[10px] text-muted-foreground border-b border-border/60">
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data.rows ?? []).slice(0, 200).map((row: Record<string, unknown>, i: number) => (
              <tr key={i} className={i % 2 === 1 ? "bg-background/40" : ""}>
                {(data.columns ?? []).map((c: { key: string }) => (
                  <td key={c.key} className="px-3 py-1.5 border-b border-border/30">
                    {String(row[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Showing first 200 rows. Download for full results.
      </p>
    </div>
  );
}
