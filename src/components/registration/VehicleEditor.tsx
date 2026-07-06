"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Truck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { vehicleSchema, type VehicleInput } from "@/lib/validators";
import { VEHICLE_TYPES } from "@/types";
import { cn } from "@/lib/utils";

interface VehicleEditorProps {
  rows: VehicleInput[];
  onChange: (rows: VehicleInput[]) => void;
}

const emptyRow: VehicleInput = {
  vehicleNumber: "",
  vehicleType: "Truck",
  vehicleColour: "",
  vehiclePurpose: "",
  vehicleMaterials: "",
};

export function VehicleEditor({ rows, onChange }: VehicleEditorProps) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {rows.length === 0
            ? "No vehicles added yet."
            : `${rows.length} vehicle${rows.length === 1 ? "" : "s"} added.`}
        </p>
        {!adding && (
          <Button
            type="button"
            onClick={() => setAdding(true)}
            className="h-10 rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90 active:scale-[0.98]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Button>
        )}
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <InlineVehicleForm
              onCancel={() => setAdding(false)}
              onSave={(row) => {
                onChange([...rows, row]);
                setAdding(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {rows.length === 0 && !adding && (
        <EmptyState
          icon={Truck}
          title="No vehicles yet"
          description="Add any vehicles or heavy equipment you will operate on site. This step is optional."
        />
      )}

      <div className="space-y-2">
        {rows.map((row, idx) => (
          <motion.div
            key={`${row.vehicleNumber}-${idx}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-12 items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-md"
          >
            <div className="col-span-12 sm:col-span-3">
              <div className="text-sm font-medium text-foreground">{row.vehicleNumber}</div>
              <div className="text-[11px] text-muted-foreground">{row.vehicleType}</div>
            </div>
            <div className="col-span-6 sm:col-span-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Colour</div>
              <div className="text-sm">{row.vehicleColour}</div>
            </div>
            <div className="col-span-6 sm:col-span-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Purpose</div>
              <div className="truncate text-sm">{row.vehiclePurpose}</div>
            </div>
            <div className="col-span-6 sm:col-span-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Materials</div>
              <div className="truncate text-sm">{row.vehicleMaterials || "—"}</div>
            </div>
            <div className="col-span-12 sm:col-span-2 flex justify-end">
              <Button
                type="button" variant="ghost" size="icon"
                onClick={() => onChange(rows.filter((_, i) => i !== idx))}
                className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function InlineVehicleForm({
  onSave, onCancel,
}: { onSave: (r: VehicleInput) => void; onCancel: () => void }) {
  const {
    register, handleSubmit, setValue, watch,
    formState: { errors },
  } = useForm<VehicleInput>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: emptyRow,
  });
  const type = watch("vehicleType");

  return (
    <div className="rounded-xl border border-[--color-brand-ocean]/40 bg-card/70 p-5 backdrop-blur-md">
      <div className="mb-4 flex items-center gap-2">
        <Plus className="h-4 w-4 text-[--color-brand-ocean]" />
        <p className="text-sm font-medium">New Vehicle</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field id="vehicleNumber" label="Vehicle Number" error={errors.vehicleNumber?.message}>
          <Input id="vehicleNumber" {...register("vehicleNumber")} placeholder="WP CAB-1234" />
        </Field>
        <Field id="vehicleType" label="Vehicle Type" error={errors.vehicleType?.message}>
          <Select value={type}
                  onValueChange={(v) => setValue("vehicleType", v as VehicleInput["vehicleType"], { shouldValidate: true })}>
            <SelectTrigger id="vehicleType"><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {VEHICLE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field id="vehicleColour" label="Colour" error={errors.vehicleColour?.message}>
          <Input id="vehicleColour" {...register("vehicleColour")} placeholder="White" />
        </Field>
        <Field id="vehiclePurpose" label="Purpose" error={errors.vehiclePurpose?.message}>
          <Input id="vehiclePurpose" {...register("vehiclePurpose")} placeholder="Material transport" />
        </Field>
        <Field
          id="vehicleMaterials"
          label="Vehicle Materials"
          className="md:col-span-2"
          error={errors.vehicleMaterials?.message}
        >
          <Textarea
            id="vehicleMaterials"
            rows={2}
            {...register("vehicleMaterials")}
            placeholder="e.g. Jack, fire extinguishers, chain, belts"
          />
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="button" onClick={handleSubmit(onSave)}
                className="bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
          Save Vehicle
        </Button>
      </div>
    </div>
  );
}

function Field({
  id, label, error, children, className,
}: {
  id: string; label: string; error?: string;
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
