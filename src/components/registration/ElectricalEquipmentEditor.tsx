"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  electricalEquipmentSchema,
  type ElectricalEquipmentInput,
} from "@/lib/validators";
import { cn } from "@/lib/utils";

interface Props {
  rows: ElectricalEquipmentInput[];
  onChange: (rows: ElectricalEquipmentInput[]) => void;
}

const empty: ElectricalEquipmentInput = {
  toolName: "",
  category: "",
  quantity: 1,
  serialNumber: "",
  powerDetails: "",
};

export function ElectricalEquipmentEditor({ rows, onChange }: Props) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {rows.length === 0
            ? "No electrical equipment added yet."
            : `${rows.length} item${rows.length === 1 ? "" : "s"} added.`}
        </p>
        {!adding && (
          <Button type="button" onClick={() => setAdding(true)}
                  className="h-10 rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90 active:scale-[0.98]">
            <Plus className="mr-2 h-4 w-4" /> Add Equipment
          </Button>
        )}
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <InlineForm onCancel={() => setAdding(false)}
                        onSave={(row) => { onChange([...rows, row]); setAdding(false); }} />
          </motion.div>
        )}
      </AnimatePresence>

      {rows.length === 0 && !adding && (
        <EmptyState icon={Zap} title="No electrical equipment yet"
                    description="Drills, grinders, welding sets — anything that runs on power. This step is optional." />
      )}

      <div className="space-y-2">
        {rows.map((row, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-12 items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-md">
            <div className="col-span-12 sm:col-span-4">
              <div className="text-sm font-medium text-foreground">{row.toolName}</div>
              <div className="text-[11px] text-muted-foreground">{row.category}</div>
            </div>
            <div className="col-span-4 sm:col-span-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Qty</div>
              <div className="text-sm">{row.quantity}</div>
            </div>
            <div className="col-span-8 sm:col-span-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Serial</div>
              <div className="truncate font-mono text-[11px]">{row.serialNumber || "—"}</div>
            </div>
            <div className="col-span-8 sm:col-span-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Power</div>
              <div className="truncate text-sm">{row.powerDetails || "—"}</div>
            </div>
            <div className="col-span-4 sm:col-span-2 flex justify-end">
              <Button type="button" variant="ghost" size="icon"
                      onClick={() => onChange(rows.filter((_, i) => i !== idx))}
                      className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function InlineForm({ onSave, onCancel }: { onSave: (r: ElectricalEquipmentInput) => void; onCancel: () => void }) {
  const { register, handleSubmit, formState: { errors } } =
    useForm<ElectricalEquipmentInput>({ resolver: zodResolver(electricalEquipmentSchema), defaultValues: empty });

  return (
    <div className="rounded-xl border border-[--color-brand-ocean]/40 bg-card/70 p-5 backdrop-blur-md">
      <div className="mb-4 flex items-center gap-2">
        <Plus className="h-4 w-4 text-[--color-brand-ocean]" />
        <p className="text-sm font-medium">New Electrical Equipment</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <F id="toolName" label="Tool / Equipment Name" error={errors.toolName?.message}>
          <Input id="toolName" {...register("toolName")} placeholder="Angle Grinder" />
        </F>
        <F id="category" label="Category" error={errors.category?.message}>
          <Input id="category" {...register("category")} placeholder="Cutting Tools" />
        </F>
        <F id="quantity" label="Quantity" error={errors.quantity?.message}>
          <Input id="quantity" type="number" min={1} {...register("quantity", { valueAsNumber: true })} />
        </F>
        <F id="serialNumber" label="Serial Number (optional)" error={errors.serialNumber?.message}>
          <Input id="serialNumber" {...register("serialNumber")} placeholder="SN-823412" />
        </F>
        <F id="powerDetails" label="Power Details (optional)" className="md:col-span-2"
           error={errors.powerDetails?.message}>
          <Input id="powerDetails" {...register("powerDetails")} placeholder="240V / 1500W" />
        </F>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="button" onClick={handleSubmit(onSave)}
                className="bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
          Save Equipment
        </Button>
      </div>
    </div>
  );
}

function F({
  id, label, error, children, className,
}: { id: string; label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
