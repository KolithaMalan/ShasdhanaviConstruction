"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

import { LabourEditor } from "@/components/registration/LabourEditor";
import { VehicleEditor } from "@/components/registration/VehicleEditor";
import { ElectricalEquipmentEditor } from "@/components/registration/ElectricalEquipmentEditor";
import { NonElectricalToolEditor } from "@/components/registration/NonElectricalToolEditor";

import type {
  AdditionalRequestType,
} from "@/types";
import type {
  ElectricalEquipmentInput,
  LabourInput,
  NonElectricalToolInput,
  VehicleInput,
} from "@/lib/validators";

interface Props {
  trigger: React.ReactNode;
  type: AdditionalRequestType;
}

const titles: Record<AdditionalRequestType, string> = {
  LABOUR: "Request Additional Employees",
  VEHICLE: "Request Additional Vehicles",
  ELECTRICAL_EQUIPMENT: "Request Additional Electrical Equipment",
  NON_ELECTRICAL_TOOLS: "Request Additional Non-Electrical Tools",
};

export function AdditionalRequestDialog({ trigger, type }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const [labour, setLabour] = useState<LabourInput[]>([]);
  const [vehicles, setVehicles] = useState<VehicleInput[]>([]);
  const [electrical, setElectrical] = useState<ElectricalEquipmentInput[]>([]);
  const [tools, setTools] = useState<NonElectricalToolInput[]>([]);

  const count =
    (type === "LABOUR" && labour.length) ||
    (type === "VEHICLE" && vehicles.length) ||
    (type === "ELECTRICAL_EQUIPMENT" && electrical.length) ||
    (type === "NON_ELECTRICAL_TOOLS" && tools.length) ||
    0;

  function submit() {
    if (count === 0) {
      toast.error("Add at least one item before submitting.");
      return;
    }
    start(async () => {
      try {
        const payload: Record<string, unknown> = {
          requestType: type,
          labourList: [], vehicles: [], electricalEquipment: [], nonElectricalTools: [],
        };
        if (type === "LABOUR") {
          payload.labourList = labour.map((l) => ({
            ...l, joinedDate: (l.joinedDate as Date).toISOString(),
          }));
        }
        if (type === "VEHICLE") payload.vehicles = vehicles;
        if (type === "ELECTRICAL_EQUIPMENT") payload.electricalEquipment = electrical;
        if (type === "NON_ELECTRICAL_TOOLS") payload.nonElectricalTools = tools;

        const res = await fetch("/api/contractor/additional-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const b = await res.json().catch(() => ({}));
          throw new Error(b.message ?? "Failed");
        }
        toast.success("Request submitted");
        setOpen(false);
        setLabour([]); setVehicles([]); setElectrical([]); setTools([]);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{titles[type]}</DialogTitle>
          <DialogDescription>
            Add the items to request, then submit. The Admin team will be notified
            and you will be emailed once a decision is made.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {type === "LABOUR" && (
            <LabourEditor
              rows={labour}
              onChange={setLabour}
              checkNicEndpoint="/api/contractor/check-nic"
            />
          )}
          {type === "VEHICLE" && <VehicleEditor rows={vehicles} onChange={setVehicles} />}
          {type === "ELECTRICAL_EQUIPMENT" && (
            <ElectricalEquipmentEditor rows={electrical} onChange={setElectrical} />
          )}
          {type === "NON_ELECTRICAL_TOOLS" && (
            <NonElectricalToolEditor rows={tools} onChange={setTools} />
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
          <Button onClick={submit} disabled={pending || count === 0}
                  className="bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Submit {count > 0 ? `(${count})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
