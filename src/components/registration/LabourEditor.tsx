"use client";

import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, UserPlus, HardHat } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { labourSchema, type LabourInput } from "@/lib/validators";
import { TRADE_TYPES } from "@/types";
import { cn } from "@/lib/utils";

interface LabourEditorProps {
  rows: LabourInput[];
  onChange: (rows: LabourInput[]) => void;
  /** Override NIC-check endpoint. Defaults to the public one so the
   *  pre-registration form works without authentication. The signed-in
   *  Additional Request dialog should pass "/api/contractor/check-nic". */
  checkNicEndpoint?: string;
}

const emptyRow: LabourInput = {
  name: "",
  nicNumber: "",
  address: "",
  mobileNumber: "",
  emergencyContact: "",
  tradeType: "Helper",
  designation: "",
  joinedDate: new Date(),
};

export function LabourEditor({ rows, onChange, checkNicEndpoint }: LabourEditorProps) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {rows.length === 0
            ? "No employees added yet."
            : `${rows.length} employee${rows.length === 1 ? "" : "s"} added.`}
        </p>
        {!adding && (
          <Button
            type="button"
            onClick={() => setAdding(true)}
            className="h-10 rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90 active:scale-[0.98]"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Employee
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
            <InlineLabourForm
              endpoint={checkNicEndpoint}
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
          icon={HardHat}
          title="No employees yet"
          description="Add the workforce you plan to bring on site. You can also leave this blank and submit additional employee requests later."
        />
      )}

      <div className="space-y-2">
        {rows.map((row, idx) => (
          <motion.div
            key={`${row.nicNumber}-${idx}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-12 items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-md"
          >
            <div className="col-span-12 sm:col-span-4">
              <div className="text-sm font-medium text-foreground">{row.name}</div>
              <div className="font-mono text-[11px] text-muted-foreground">
                {row.nicNumber}
              </div>
            </div>
            <div className="col-span-6 sm:col-span-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Trade</div>
              <div className="text-sm">{row.tradeType}</div>
            </div>
            <div className="col-span-6 sm:col-span-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Joined</div>
              <div className="text-sm">
                {new Date(row.joinedDate).toLocaleDateString("en-GB")}
              </div>
            </div>
            <div className="col-span-12 sm:col-span-2 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
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

function InlineLabourForm({
  onSave,
  onCancel,
  endpoint = "/api/public/check-nic",
}: {
  onSave: (row: LabourInput) => void;
  onCancel: () => void;
  endpoint?: string;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LabourInput>({
    resolver: zodResolver(labourSchema),
    defaultValues: emptyRow,
  });
  const trade = watch("tradeType");
  const nicValue = watch("nicNumber");
  const dateValue = watch("joinedDate") instanceof Date
    ? (watch("joinedDate") as Date).toISOString().slice(0, 10)
    : "";

  /* ── Live NIC duplicate check ── */
  type NicState = { state: "idle" | "checking" | "ok" | "bad"; message?: string };
  const [nicStatus, setNicStatus] = useState<NicState>({ state: "idle" });

  React.useEffect(() => {
    const upper = (nicValue ?? "").trim().toUpperCase();
    if (!upper) { setNicStatus({ state: "idle" }); return; }
    if (!/^(\d{9}[VX]|\d{12})$/.test(upper)) { setNicStatus({ state: "idle" }); return; }

    const ctrl = new AbortController();
    const handle = window.setTimeout(async () => {
      setNicStatus({ state: "checking" });
      try {
        const res = await fetch(`${endpoint}?nic=${encodeURIComponent(upper)}`, { signal: ctrl.signal });
        const body = await res.json();
        if (body.available) {
          setNicStatus({ state: "ok", message: "NIC available" });
        } else {
          setNicStatus({ state: "bad", message: body.message ?? "NIC already in use" });
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") setNicStatus({ state: "idle" });
      }
    }, 350);
    return () => { window.clearTimeout(handle); ctrl.abort(); };
  }, [nicValue, endpoint]);

  const canSave = nicStatus.state !== "bad";

  return (
    <div className="rounded-xl border border-[--color-brand-ocean]/40 bg-card/70 p-5 backdrop-blur-md">
      <div className="mb-4 flex items-center gap-2">
        <Plus className="h-4 w-4 text-[--color-brand-ocean]" />
        <p className="text-sm font-medium">New Employee</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field id="name" label="Full Name" error={errors.name?.message}>
          <Input id="name" {...register("name")} placeholder="e.g. K.A. Perera" />
        </Field>
        <Field
          id="nicNumber"
          label="NIC Number"
          error={errors.nicNumber?.message ?? (nicStatus.state === "bad" ? nicStatus.message : undefined)}
          helper={
            errors.nicNumber?.message
              ? undefined
              : nicStatus.state === "ok"
                ? "✓ NIC available"
                : nicStatus.state === "checking"
                  ? "Checking…"
                  : "Format: 9 digits + V/X, or 12 digits."
          }
        >
          <Input id="nicNumber" {...register("nicNumber")} placeholder="952341234V or 199523401234" />
        </Field>
        <Field id="address" label="Address" className="md:col-span-2"
               error={errors.address?.message}>
          <Input id="address" {...register("address")} placeholder="No. 32, Main St, Kandy" />
        </Field>
        <Field id="mobileNumber" label="Mobile Number" error={errors.mobileNumber?.message}>
          <Input id="mobileNumber" {...register("mobileNumber")} placeholder="+94 71 234 5678" />
        </Field>
        <Field id="emergencyContact" label="Emergency Contact" error={errors.emergencyContact?.message}>
          <Input id="emergencyContact" {...register("emergencyContact")} placeholder="+94 77 123 4567" />
        </Field>
        <Field
          id="tradeType"
          label="Trade Type"
          error={errors.tradeType?.message}
          helper="Make sure to select the correct designation."
        >
          <Select value={trade} onValueChange={(v) => setValue("tradeType", v as LabourInput["tradeType"], { shouldValidate: true })}>
            <SelectTrigger id="tradeType"><SelectValue placeholder="Select trade" /></SelectTrigger>
            <SelectContent>
              {TRADE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id="joinedDate" label="Joined Date" error={errors.joinedDate?.message}>
          <Input id="joinedDate" type="date"
                 value={dateValue}
                 onChange={(e) => setValue("joinedDate", new Date(e.target.value), { shouldValidate: true })} />
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button
          type="button"
          onClick={handleSubmit((data) => onSave({ ...data, designation: data.tradeType }))}
          disabled={!canSave}
          className="bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90 disabled:opacity-50"
        >
          Save Employee
        </Button>
      </div>
    </div>
  );
}

function Field({
  id, label, error, helper, children, className,
}: {
  id: string; label: string; error?: string; helper?: string;
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
      {helper && !error && <p className="text-[11px] text-muted-foreground">{helper}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
