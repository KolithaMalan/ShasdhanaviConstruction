"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpFromLine,
  CheckCircle2, Loader2, Plus, Search, Trash2, Wrench, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { BalanceBar } from "@/components/admin/tools/BalanceBar";
import { cn } from "@/lib/utils";
import type { SerializedElectricalEquipment, SerializedNonElectricalTool } from "@/lib/tools";

type Direction = "IN" | "OUT";
type Step = 1 | 2 | 3 | 4;

interface ContractorOption {
  id: string;
  companyName: string;
  email: string;
}

interface SelectedItem {
  toolType: "ELECTRICAL" | "NON_ELECTRICAL";
  toolId: string;
  toolName: string;
  toolIdentifier: string;
  quantity: number;
  currentBalance: number;
  approvedQuantity: number;
}

export function GatePassWorkstation() {
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<Direction | null>(null);

  /* Step 2 */
  const [contractorQuery, setContractorQuery] = useState("");
  const [contractorOptions, setContractorOptions] = useState<ContractorOption[] | null>(null);
  const [contractor, setContractor] = useState<ContractorOption | null>(null);
  const [gatePassId, setGatePassId] = useState("");
  const [notes, setNotes] = useState("");

  /* Step 3 inventory */
  const [electrical, setElectrical] = useState<SerializedElectricalEquipment[] | null>(null);
  const [nonElectrical, setNonElectrical] = useState<SerializedNonElectricalTool[] | null>(null);

  /* Selected items */
  const [selected, setSelected] = useState<SelectedItem[]>([]);

  /* Submit */
  const [pending, start] = useTransition();
  const [submittedSummary, setSubmittedSummary] = useState<SelectedItem[] | null>(null);

  /* Fetch contractor list */
  useEffect(() => {
    const t = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (contractorQuery.trim()) params.set("q", contractorQuery.trim());
      fetch(`/api/internal-security/contractors?${params}`)
        .then((r) => r.json())
        .then((b) => setContractorOptions(b.items ?? []))
        .catch(() => setContractorOptions([]));
    }, 200);
    return () => window.clearTimeout(t);
  }, [contractorQuery]);

  /* Fetch contractor inventory when entering step 3 */
  useEffect(() => {
    if (step !== 3 || !contractor) return;
    setElectrical(null);
    setNonElectrical(null);
    fetch(`/api/internal-security/contractor/${contractor.id}/inventory`)
      .then((r) => r.json())
      .then((b) => {
        setElectrical(b.electrical ?? []);
        setNonElectrical(b.nonElectrical ?? []);
      })
      .catch(() => { setElectrical([]); setNonElectrical([]); });
  }, [step, contractor]);

  const total = selected.reduce((s, i) => s + i.quantity, 0);

  function resetAll() {
    setStep(1); setDirection(null);
    setContractorQuery(""); setContractor(null);
    setGatePassId(""); setNotes("");
    setElectrical(null); setNonElectrical(null);
    setSelected([]); setSubmittedSummary(null);
  }

  function addElectrical(e: SerializedElectricalEquipment, qty: number) {
    if (!qty || qty < 1) return;
    if (direction === "OUT" && qty > e.currentBalance) {
      toast.error(`Only ${e.currentBalance} on site for ${e.toolName}`); return;
    }
    if (selected.some((s) => s.toolType === "ELECTRICAL" && s.toolId === e.id)) {
      toast.error("Already added — remove from list to change quantity"); return;
    }
    setSelected((prev) => [...prev, {
      toolType: "ELECTRICAL", toolId: e.id, toolName: e.toolName,
      toolIdentifier: e.equipmentId, quantity: qty,
      currentBalance: e.currentBalance, approvedQuantity: e.quantity,
    }]);
  }

  function addNonElectrical(t: SerializedNonElectricalTool, qty: number) {
    if (!qty || qty < 1) return;
    if (direction === "OUT" && qty > t.currentBalance) {
      toast.error(`Only ${t.currentBalance} on site for ${t.toolName}`); return;
    }
    if (direction === "IN" && t.currentBalance + qty > t.approvedQuantity) {
      toast.error(`Would exceed approved quantity ${t.approvedQuantity}`); return;
    }
    if (selected.some((s) => s.toolType === "NON_ELECTRICAL" && s.toolId === t.id)) {
      toast.error("Already added — remove from list to change quantity"); return;
    }
    setSelected((prev) => [...prev, {
      toolType: "NON_ELECTRICAL", toolId: t.id, toolName: t.toolName,
      toolIdentifier: t.toolId, quantity: qty,
      currentBalance: t.currentBalance, approvedQuantity: t.approvedQuantity,
    }]);
  }

  function removeSelected(idx: number) {
    setSelected((prev) => prev.filter((_, i) => i !== idx));
  }

  function submit() {
    if (!direction || !contractor) return;
    start(async () => {
      const res = await fetch("/api/internal-security/process-movement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction, contractorId: contractor.id, gatePassId: gatePassId.trim(), notes,
          items: selected.map((s) => ({
            toolType: s.toolType, toolId: s.toolId, quantity: s.quantity,
          })),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(body.message ?? "Failed"); return; }
      toast.success("Gate pass processed", { description: `${selected.length} item(s) ${direction}` });
      setSubmittedSummary(selected);
    });
  }

  return (
    <div className="space-y-6">
      <Stepper step={step} />

      <AnimatePresence mode="wait">
        {submittedSummary ? (
          <SuccessStep
            key="success"
            direction={direction!}
            contractor={contractor!}
            gatePassId={gatePassId}
            items={submittedSummary}
            onReset={resetAll}
          />
        ) : step === 1 ? (
          <Step1 key="s1" onPick={(d) => { setDirection(d); setStep(2); }} />
        ) : step === 2 ? (
          <Step2
            key="s2"
            direction={direction!}
            contractor={contractor}
            options={contractorOptions}
            query={contractorQuery}
            onQuery={setContractorQuery}
            onPickContractor={setContractor}
            gatePassId={gatePassId}
            onGatePassId={setGatePassId}
            notes={notes}
            onNotes={setNotes}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        ) : step === 3 ? (
          <Step3
            key="s3"
            direction={direction!}
            electrical={electrical}
            nonElectrical={nonElectrical}
            selected={selected}
            onAddElectrical={addElectrical}
            onAddNonElectrical={addNonElectrical}
            onRemoveSelected={removeSelected}
            onBack={() => setStep(2)}
            onContinue={() => {
              if (selected.length === 0) { toast.error("Add at least one item"); return; }
              setStep(4);
            }}
          />
        ) : (
          <Step4
            key="s4"
            direction={direction!}
            contractor={contractor!}
            gatePassId={gatePassId}
            notes={notes}
            selected={selected}
            pending={pending}
            onBack={() => setStep(3)}
            onConfirm={submit}
          />
        )}
      </AnimatePresence>

      <p className="text-center text-[11px] text-muted-foreground">
        Total items in pass: <span className="font-mono font-semibold text-foreground">{total}</span>
      </p>
    </div>
  );
}

/* ─────── Stepper ─────── */

function Stepper({ step }: { step: Step | "DONE" | number }) {
  const labels = ["Operation", "Pass details", "Select tools", "Confirm"];
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-md">
      <ol className="grid grid-cols-4 gap-2">
        {labels.map((label, i) => {
          const n = i + 1;
          const isCurrent = step === n;
          const isDone = typeof step === "number" && step > n;
          return (
            <li key={label} className="flex flex-col items-center gap-1.5">
              <span className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ring-1 transition-colors",
                isDone ? "bg-emerald-500/15 text-emerald-500 ring-emerald-500/40"
                  : isCurrent ? "bg-[--color-brand-ocean] text-white ring-[--color-brand-ocean]/50"
                    : "bg-background ring-border text-muted-foreground",
              )}>
                {isDone ? "✓" : n}
              </span>
              <span className={cn(
                "text-[10px] uppercase tracking-wider",
                isCurrent ? "text-foreground font-semibold" : "text-muted-foreground",
              )}>{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ─────── Step 1 ─────── */

function Step1({ onPick }: { onPick: (d: Direction) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <button type="button" onClick={() => onPick("OUT")}
              className="group rounded-2xl border-2 border-red-500/40 bg-red-500/5 p-10 text-left transition-all hover:-translate-y-0.5 hover:bg-red-500/10 hover:shadow-xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-500/15 text-red-500">
          <ArrowUpFromLine className="h-7 w-7" />
        </div>
        <h3 className="mt-5 font-heading text-2xl font-bold">OUT</h3>
        <p className="text-sm text-muted-foreground">Tools leaving the site</p>
        <span className="mt-6 inline-flex items-center text-sm font-medium text-red-600 group-hover:translate-x-0.5 transition-transform">
          Proceed <ArrowRight className="ml-1.5 h-4 w-4" />
        </span>
      </button>
      <button type="button" onClick={() => onPick("IN")}
              className="group rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-10 text-left transition-all hover:-translate-y-0.5 hover:bg-emerald-500/10 hover:shadow-xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
          <ArrowDownToLine className="h-7 w-7" />
        </div>
        <h3 className="mt-5 font-heading text-2xl font-bold">IN</h3>
        <p className="text-sm text-muted-foreground">Tools returning to the site</p>
        <span className="mt-6 inline-flex items-center text-sm font-medium text-emerald-600 group-hover:translate-x-0.5 transition-transform">
          Proceed <ArrowRight className="ml-1.5 h-4 w-4" />
        </span>
      </button>
    </motion.div>
  );
}

/* ─────── Step 2 ─────── */

interface Step2Props {
  direction: Direction;
  contractor: ContractorOption | null;
  options: ContractorOption[] | null;
  query: string;
  onQuery: (v: string) => void;
  onPickContractor: (c: ContractorOption | null) => void;
  gatePassId: string;
  onGatePassId: (v: string) => void;
  notes: string;
  onNotes: (v: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

function Step2({
  direction, contractor, options, query, onQuery, onPickContractor,
  gatePassId, onGatePassId, notes, onNotes, onBack, onContinue,
}: Step2Props) {
  const canContinue = !!contractor && gatePassId.trim().length > 0;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-5 rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md sm:p-6">
      <div className="flex items-center gap-3">
        <span className={cn(
          "rounded-md px-2 py-0.5 text-xs font-semibold ring-1",
          direction === "OUT" ? "bg-red-500/10 text-red-600 ring-red-500/40" : "bg-emerald-500/10 text-emerald-600 ring-emerald-500/40",
        )}>{direction}</span>
        <h2 className="font-heading text-lg font-semibold">Pass details</h2>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Contractor</Label>
        {contractor ? (
          <div className="flex items-center justify-between rounded-lg border border-[--color-brand-ocean]/40 bg-[--color-brand-ocean]/5 p-3">
            <div>
              <div className="font-medium">{contractor.companyName}</div>
              <div className="font-mono text-[11px] text-muted-foreground">{contractor.email}</div>
            </div>
            <Button variant="ghost" onClick={() => onPickContractor(null)}>Change</Button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="h-11 pl-9" placeholder="Search contractor by name or email…"
                     value={query} onChange={(e) => onQuery(e.target.value)} />
            </div>
            <div className="max-h-64 overflow-auto rounded-lg border border-border/60">
              {options === null ? (
                <Skeleton className="h-24 w-full" />
              ) : options.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">No contractors found.</p>
              ) : (
                options.map((c) => (
                  <button key={c.id} type="button" onClick={() => onPickContractor(c)}
                          className="flex w-full items-center justify-between border-b border-border/60 px-3 py-2 text-left last:border-b-0 hover:bg-accent/10">
                    <div>
                      <div className="text-sm font-medium">{c.companyName}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{c.email}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="gpid" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Gate Pass ID
        </Label>
        <Input id="gpid" value={gatePassId} onChange={(e) => onGatePassId(e.target.value)}
               placeholder="GP-2026-001" className="h-11 font-mono uppercase" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Notes (optional)
        </Label>
        <Textarea id="notes" rows={3} value={notes} onChange={(e) => onNotes(e.target.value)} />
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
        <Button onClick={onContinue} disabled={!canContinue}
                className="h-11 rounded-lg bg-[--color-brand-ocean] px-6 text-white hover:bg-[--color-brand-ocean]/90">
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

/* ─────── Step 3 ─────── */

interface Step3Props {
  direction: Direction;
  electrical: SerializedElectricalEquipment[] | null;
  nonElectrical: SerializedNonElectricalTool[] | null;
  selected: SelectedItem[];
  onAddElectrical: (e: SerializedElectricalEquipment, qty: number) => void;
  onAddNonElectrical: (t: SerializedNonElectricalTool, qty: number) => void;
  onRemoveSelected: (idx: number) => void;
  onBack: () => void;
  onContinue: () => void;
}

function Step3({
  direction, electrical, nonElectrical, selected,
  onAddElectrical, onAddNonElectrical, onRemoveSelected, onBack, onContinue,
}: Step3Props) {
  const availableElectrical = useMemo(
    () => (electrical ?? []).filter((e) =>
      e.status === "APPROVED_INVENTORY" && (direction === "IN" || e.currentBalance > 0),
    ),
    [electrical, direction],
  );
  const availableNonElectrical = useMemo(
    () => (nonElectrical ?? []).filter((t) =>
      t.status !== "BLOCKED" && (direction === "IN" || t.currentBalance > 0),
    ),
    [nonElectrical, direction],
  );

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md">
        <Tabs defaultValue="electrical">
          <TabsList>
            <TabsTrigger value="electrical"><Zap className="mr-2 h-3.5 w-3.5" /> Electrical</TabsTrigger>
            <TabsTrigger value="non-electrical"><Wrench className="mr-2 h-3.5 w-3.5" /> Non-Electrical</TabsTrigger>
          </TabsList>

          <TabsContent value="electrical" className="mt-4">
            {electrical === null ? <Skeleton className="h-48 w-full" /> :
             availableElectrical.length === 0 ? <EmptyState icon={Zap} title="No approved electrical equipment available" /> : (
              <ScrollArea className="max-h-[55vh]">
                <div className="space-y-2">
                  {availableElectrical.map((e) => (
                    <ItemRow key={e.id}
                      title={e.toolName} subtitle={e.equipmentId}
                      meta={`Balance ${e.currentBalance}/${e.quantity}`}
                      direction={direction}
                      max={direction === "OUT" ? e.currentBalance : Math.max(1, e.quantity)}
                      onAdd={(qty) => onAddElectrical(e, qty)}
                    />
                  ))}
                </div>
              </ScrollArea>
             )}
          </TabsContent>

          <TabsContent value="non-electrical" className="mt-4">
            {nonElectrical === null ? <Skeleton className="h-48 w-full" /> :
             availableNonElectrical.length === 0 ? <EmptyState icon={Wrench} title="No non-electrical tools available" /> : (
              <ScrollArea className="max-h-[55vh]">
                <div className="space-y-2">
                  {availableNonElectrical.map((t) => (
                    <ItemRow key={t.id}
                      title={`${t.toolName} (${t.unit})`} subtitle={t.toolId}
                      meta={`Balance ${t.currentBalance}/${t.approvedQuantity}`}
                      direction={direction}
                      max={direction === "OUT" ? t.currentBalance : (t.approvedQuantity - t.currentBalance)}
                      onAdd={(qty) => onAddNonElectrical(t, qty)}
                    />
                  ))}
                </div>
              </ScrollArea>
             )}
          </TabsContent>
        </Tabs>
      </div>

      <aside className="space-y-3 rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md">
        <h3 className="font-heading text-base font-semibold">Selected items ({selected.length})</h3>
        {selected.length === 0 ? (
          <p className="text-sm text-muted-foreground">Pick items from the list on the left to add them to this gate pass.</p>
        ) : (
          <ul className="space-y-2">
            {selected.map((s, i) => (
              <li key={i} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/40 p-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{s.toolName}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{s.toolIdentifier}</div>
                </div>
                <span className="font-mono text-sm font-semibold">{s.quantity}</span>
                <Button variant="ghost" size="icon" onClick={() => onRemoveSelected(i)}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
          <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
          <Button onClick={onContinue} disabled={selected.length === 0}
                  className="h-11 rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
            Review <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </aside>
    </motion.div>
  );
}

function ItemRow({
  title, subtitle, meta, direction, max, onAdd,
}: {
  title: string; subtitle: string; meta: string;
  direction: Direction; max: number; onAdd: (qty: number) => void;
}) {
  const [qty, setQty] = useState(1);
  const disabled = direction === "OUT" && max === 0;
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/40 p-3">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{title}</div>
        <div className="font-mono text-[11px] text-muted-foreground">{subtitle}</div>
        <div className="mt-1 text-[11px] text-muted-foreground">{meta}</div>
      </div>
      <div className="flex items-center gap-2">
        <Input type="number" min={1} max={direction === "OUT" ? max : undefined}
               value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
               disabled={disabled} className="h-9 w-20 text-center font-mono" />
        <Button size="sm" disabled={disabled} onClick={() => onAdd(qty)}
                className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
          <Plus className="mr-1 h-3.5 w-3.5" /> Add
        </Button>
      </div>
    </div>
  );
}

/* ─────── Step 4 ─────── */

interface Step4Props {
  direction: Direction;
  contractor: ContractorOption;
  gatePassId: string;
  notes: string;
  selected: SelectedItem[];
  pending: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

function Step4({ direction, contractor, gatePassId, notes, selected, pending, onBack, onConfirm }: Step4Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-5 rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">Review & Confirm</h2>
        <span className={cn(
          "rounded-md px-2 py-0.5 text-xs font-semibold ring-1",
          direction === "OUT" ? "bg-red-500/10 text-red-600 ring-red-500/40" : "bg-emerald-500/10 text-emerald-600 ring-emerald-500/40",
        )}>{direction}</span>
      </div>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Item label="Contractor" value={contractor.companyName} />
        <Item label="Gate Pass ID" value={gatePassId} mono />
        <Item label="Items" value={String(selected.length)} />
        {notes && <div className="sm:col-span-3"><Item label="Notes" value={notes} /></div>}
      </dl>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tool</TableHead><TableHead>Type</TableHead>
            <TableHead>Current</TableHead><TableHead>Moving</TableHead>
            <TableHead>New Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {selected.map((s, i) => {
            const after = direction === "OUT" ? s.currentBalance - s.quantity : s.currentBalance + s.quantity;
            return (
              <TableRow key={i}>
                <TableCell>
                  <div className="font-medium">{s.toolName}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{s.toolIdentifier}</div>
                </TableCell>
                <TableCell>{s.toolType === "ELECTRICAL" ? "Electrical" : "Non-Electrical"}</TableCell>
                <TableCell className="w-24"><BalanceBar current={s.currentBalance} total={s.approvedQuantity} /></TableCell>
                <TableCell className="font-mono">{direction === "OUT" ? "-" : "+"}{s.quantity}</TableCell>
                <TableCell className="font-mono font-semibold">{after}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={onBack} disabled={pending}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={onConfirm} disabled={pending}
                className="h-14 rounded-2xl bg-[--color-brand-ocean] px-8 text-lg font-bold text-white shadow-lg shadow-[--color-brand-ocean]/30 hover:bg-[--color-brand-ocean]/90 active:scale-[0.98]">
          {pending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
          CONFIRM & PROCESS
        </Button>
      </div>
    </motion.div>
  );
}

function Item({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={"mt-0.5 text-sm font-medium text-foreground " + (mono ? "font-mono" : "")}>{value}</dd>
    </div>
  );
}

function SuccessStep({
  direction, contractor, gatePassId, items, onReset,
}: {
  direction: Direction; contractor: ContractorOption; gatePassId: string;
  items: SelectedItem[]; onReset: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-10 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
      <h2 className="mt-4 font-heading text-2xl font-bold">Gate pass processed</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {items.length} item{items.length === 1 ? "" : "s"} marked {direction} for {contractor.companyName} on pass <span className="font-mono">{gatePassId}</span>.
      </p>
      <Button onClick={onReset} className="mt-6 rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
        Process Another Gate Pass
      </Button>
    </motion.div>
  );
}
