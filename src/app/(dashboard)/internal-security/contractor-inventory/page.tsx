"use client";

import { useEffect, useState } from "react";
import { Boxes, Search, Wrench, Zap } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { BalanceBar } from "@/components/admin/tools/BalanceBar";
import { InspectionStatusBadge } from "@/components/admin/tools/InspectionStatusBadge";
import type { SerializedElectricalEquipment, SerializedNonElectricalTool } from "@/lib/tools";

interface ContractorOption { id: string; companyName: string; email: string }

interface Inventory {
  contractor: { id: string; companyName: string; email: string };
  electrical: SerializedElectricalEquipment[];
  nonElectrical: SerializedNonElectricalTool[];
}

export default function ContractorInventoryPage() {
  const [q, setQ] = useState("");
  const [options, setOptions] = useState<ContractorOption[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inv, setInv] = useState<Inventory | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      fetch(`/api/internal-security/contractors?${params}`)
        .then((r) => r.json())
        .then((b) => setOptions(b.items ?? []))
        .catch(() => setOptions([]));
    }, 200);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!selectedId) { setInv(null); return; }
    setInv(null);
    fetch(`/api/internal-security/contractor/${selectedId}/inventory`)
      .then((r) => r.json())
      .then((b) => setInv(b))
      .catch(() => setInv(null));
  }, [selectedId]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Internal Security"
          title="Contractor Inventory"
          description="Look up any contractor's current tool inventory before processing a gate pass."
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-md">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="h-10 pl-9" placeholder="Search contractor…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="mt-3 max-h-[60vh] overflow-auto rounded-lg border border-border/60">
              {options === null ? <Skeleton className="h-32 w-full" /> :
               options.length === 0 ? (
                 <p className="p-6 text-center text-sm text-muted-foreground">No contractors</p>
               ) : options.map((c) => {
                const active = c.id === selectedId;
                return (
                  <button key={c.id} type="button" onClick={() => setSelectedId(c.id)}
                          className={
                            "block w-full border-b border-border/60 px-3 py-2 text-left last:border-b-0 hover:bg-accent/10 " +
                            (active ? "bg-[--color-brand-ocean]/10" : "")
                          }>
                    <div className="text-sm font-medium">{c.companyName}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{c.email}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-2">
            {!selectedId ? (
              <EmptyState icon={Boxes} title="Pick a contractor to view their inventory" />
            ) : !inv ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[--color-brand-ocean]">Contractor</p>
                  <h2 className="mt-1 font-heading text-xl font-semibold">{inv.contractor.companyName}</h2>
                  <p className="font-mono text-xs text-muted-foreground">{inv.contractor.email}</p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md">
                  <Tabs defaultValue="electrical">
                    <TabsList>
                      <TabsTrigger value="electrical"><Zap className="mr-2 h-3.5 w-3.5" /> Electrical ({inv.electrical.length})</TabsTrigger>
                      <TabsTrigger value="non-electrical"><Wrench className="mr-2 h-3.5 w-3.5" /> Non-Electrical ({inv.nonElectrical.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="electrical" className="mt-4">
                      {inv.electrical.length === 0 ? <EmptyState icon={Zap} title="No electrical equipment" /> : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Equipment</TableHead><TableHead>Balance</TableHead>
                              <TableHead>Inspection</TableHead><TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {inv.electrical.map((e) => (
                              <TableRow key={e.id}>
                                <TableCell>
                                  <div className="font-medium">{e.toolName}</div>
                                  <div className="font-mono text-[11px] text-muted-foreground">{e.equipmentId}</div>
                                </TableCell>
                                <TableCell className="w-32"><BalanceBar current={e.currentBalance} total={e.quantity} /></TableCell>
                                <TableCell><InspectionStatusBadge kind="inspection" value={e.inspectionStatus} /></TableCell>
                                <TableCell><InspectionStatusBadge kind="lifecycle" value={e.status} /></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </TabsContent>
                    <TabsContent value="non-electrical" className="mt-4">
                      {inv.nonElectrical.length === 0 ? <EmptyState icon={Wrench} title="No non-electrical tools" /> : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tool</TableHead><TableHead>Unit</TableHead>
                              <TableHead>Balance</TableHead><TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {inv.nonElectrical.map((t) => (
                              <TableRow key={t.id}>
                                <TableCell>
                                  <div className="font-medium">{t.toolName}</div>
                                  <div className="font-mono text-[11px] text-muted-foreground">{t.toolId}</div>
                                </TableCell>
                                <TableCell>{t.unit}</TableCell>
                                <TableCell className="w-32"><BalanceBar current={t.currentBalance} total={t.approvedQuantity} /></TableCell>
                                <TableCell><InspectionStatusBadge kind="nonElectrical" value={t.status} /></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}
          </div>
        </div>
      </MotionWrapper>
    </div>
  );
}
