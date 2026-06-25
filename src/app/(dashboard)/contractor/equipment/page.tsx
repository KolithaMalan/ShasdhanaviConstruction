"use client";

import { useEffect, useState, useTransition } from "react";
import { Download, FileText, Loader2, Plus, Wrench, Zap } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { BalanceBar } from "@/components/admin/tools/BalanceBar";
import { InspectionStatusBadge } from "@/components/admin/tools/InspectionStatusBadge";
import { AdditionalRequestDialog } from "@/components/contractor/AdditionalRequestDialog";
import type { SerializedElectricalEquipment, SerializedNonElectricalTool } from "@/lib/tools";

export default function ContractorEquipmentPage() {
  const [downloading, startDownload] = useTransition();

  function downloadMaterialsForm() {
    startDownload(async () => {
      try {
        const res = await fetch("/api/contractor/materials-pass-pdf");
        if (!res.ok) throw new Error();
        const date = new Date().toISOString().slice(0, 10);
        triggerDownload(await res.blob(), `materials-in-out-${date}.pdf`);
        toast.success("Materials form downloaded", {
          description: "Print it and present the QR at the security gate.",
        });
      } catch {
        toast.error("Download failed");
      }
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Contractor"
          title="My Equipment"
          description="Track your electrical equipment through HSEQ inspection and your non-electrical tool inventory on site."
          actions={
            <Button
              onClick={downloadMaterialsForm}
              disabled={downloading}
              className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90"
            >
              {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
              Download Materials Form (PDF)
            </Button>
          }
        />
      </MotionWrapper>
      <MotionWrapper delay={0.05}>
        <Tabs defaultValue="electrical">
          <TabsList>
            <TabsTrigger value="electrical"><Zap className="mr-2 h-3.5 w-3.5" /> Electrical</TabsTrigger>
            <TabsTrigger value="non-electrical"><Wrench className="mr-2 h-3.5 w-3.5" /> Non-Electrical</TabsTrigger>
          </TabsList>
          <TabsContent value="electrical" className="mt-4"><ElectricalTab /></TabsContent>
          <TabsContent value="non-electrical" className="mt-4"><NonElectricalTab /></TabsContent>
        </Tabs>
      </MotionWrapper>
    </div>
  );
}

function ElectricalTab() {
  const [items, setItems] = useState<SerializedElectricalEquipment[] | null>(null);
  const [inspection, setInspection] = useState("ALL");
  const [pending, start] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (inspection !== "ALL") params.set("inspectionStatus", inspection);
    fetch(`/api/contractor/equipment/electrical?${params}`)
      .then((r) => r.json())
      .then((b) => setItems(b.items ?? []))
      .catch(() => setItems([]));
  }, [inspection]);

  async function downloadSticker(e: SerializedElectricalEquipment) {
    if (e.inspectionStatus !== "PASSED") {
      toast.error("Sticker is available after the item passes HSEQ inspection"); return;
    }
    setActiveId(e.id);
    start(async () => {
      try {
        const res = await fetch(`/api/hseq/electrical/${e.id}/qr-sticker-pdf`);
        if (!res.ok) throw new Error();
        triggerDownload(await res.blob(), `qr-sticker-${e.equipmentId}.pdf`);
        toast.success("QR sticker downloaded");
      } catch { toast.error("Download failed"); }
      setActiveId(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={inspection} onValueChange={setInspection}>
          <SelectTrigger className="h-9 w-48"><SelectValue placeholder="Inspection status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Any status</SelectItem>
            <SelectItem value="PENDING_INSPECTION">Pending Inspection</SelectItem>
            <SelectItem value="PASSED">Passed</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
        <AdditionalRequestDialog
          type="ELECTRICAL_EQUIPMENT"
          trigger={
            <Button className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
              <Plus className="mr-2 h-4 w-4" /> Request More Electrical
            </Button>
          }
        />
      </div>

      {items === null ? <Skeleton className="h-64 w-full" /> :
       items.length === 0 ? <EmptyState icon={Zap} title="No electrical equipment yet" description="Submitted electrical items appear here once admin approves." /> : (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipment ID</TableHead>
                <TableHead>Tool</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Inspection</TableHead>
                <TableHead>Next Due</TableHead>
                <TableHead className="text-right">Sticker</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs">{e.equipmentId}</TableCell>
                  <TableCell className="font-medium">{e.toolName}</TableCell>
                  <TableCell>{e.category || "—"}</TableCell>
                  <TableCell className="w-28"><BalanceBar current={e.currentBalance} total={e.quantity} /></TableCell>
                  <TableCell><InspectionStatusBadge kind="inspection" value={e.inspectionStatus} /></TableCell>
                  <TableCell className="text-xs">
                    {e.nextInspectionDue ? new Date(e.nextInspectionDue).toLocaleDateString("en-GB") : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline"
                            onClick={() => downloadSticker(e)}
                            disabled={pending || e.inspectionStatus !== "PASSED"}
                            className="rounded-lg">
                      {pending && activeId === e.id
                        ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        : <Download className="mr-1.5 h-3.5 w-3.5" />}
                      QR Sticker
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
       )}
    </div>
  );
}

function NonElectricalTab() {
  const [items, setItems] = useState<SerializedNonElectricalTool[] | null>(null);
  const [status, setStatus] = useState("ALL");

  useEffect(() => {
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    fetch(`/api/contractor/equipment/non-electrical?${params}`)
      .then((r) => r.json())
      .then((b) => setItems(b.items ?? []))
      .catch(() => setItems([]));
  }, [status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Any status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="DEPLETED">Depleted</SelectItem>
            <SelectItem value="BLOCKED">Blocked</SelectItem>
          </SelectContent>
        </Select>
        <AdditionalRequestDialog
          type="NON_ELECTRICAL_TOOLS"
          trigger={
            <Button className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
              <Plus className="mr-2 h-4 w-4" /> Request More Non-Electrical
            </Button>
          }
        />
      </div>

      {items === null ? <Skeleton className="h-64 w-full" /> :
       items.length === 0 ? <EmptyState icon={Wrench} title="No non-electrical tools yet" description="Items appear here once admin approves them." /> : (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool ID</TableHead>
                <TableHead>Tool</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.toolId}</TableCell>
                  <TableCell className="font-medium">{t.toolName}</TableCell>
                  <TableCell>{t.category || "—"}</TableCell>
                  <TableCell className="font-mono">{t.approvedQuantity}</TableCell>
                  <TableCell className="w-28"><BalanceBar current={t.currentBalance} total={t.approvedQuantity} /></TableCell>
                  <TableCell>{t.unit}</TableCell>
                  <TableCell><InspectionStatusBadge kind="nonElectrical" value={t.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
       )}
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
