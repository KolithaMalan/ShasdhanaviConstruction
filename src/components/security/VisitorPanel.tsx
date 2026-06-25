"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowUpFromLine, IdCard, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nicSchema } from "@/lib/validators";

const entrySchema = z.object({
  name: z.string().min(2, "Name is required").max(120),
  nicNumber: nicSchema,
  company: z.string().max(160).optional().default(""),
  purpose: z.string().max(400).optional().default(""),
  contactPerson: z.string().max(160).optional().default(""),
});
type EntryForm = z.infer<typeof entrySchema>;

interface CurrentVisitor {
  id: string;
  name: string;
  nicNumber: string;
  company: string;
  purpose: string;
  contactPerson: string;
  enteredAt: string;
}

interface Props {
  passId: string;
  currentVisitor: CurrentVisitor | null;
  onCompleted: () => void;
}

export function VisitorPanel({ passId, currentVisitor, onCompleted }: Props) {
  const [pending, start] = useTransition();
  const isExitMode = !!currentVisitor;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EntryForm>({
    resolver: zodResolver(entrySchema),
    defaultValues: { name: "", nicNumber: "", company: "", purpose: "", contactPerson: "" },
  });

  const [confirmExit, setConfirmExit] = useState(false);

  function submitEntry(data: EntryForm) {
    start(async () => {
      const res = await fetch("/api/security/visitor-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passId, ...data }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(body.message ?? "Entry failed"); return; }
      toast.success(`Visitor ${data.name} marked IN`);
      onCompleted();
    });
  }

  function submitExit() {
    start(async () => {
      const res = await fetch("/api/security/visitor-exit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(body.message ?? "Exit failed"); return; }
      toast.success("Visitor marked OUT — pass released");
      setConfirmExit(false);
      onCompleted();
    });
  }

  return (
    <div className="flex h-full flex-col gap-5 rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <span className={
          "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-2xl font-semibold uppercase tracking-wide " +
          (isExitMode
            ? "bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/40"
            : "bg-sky-500/15 text-sky-500 ring-1 ring-sky-500/40")
        }>
          <IdCard className="h-6 w-6" />
          {isExitMode ? "VISITOR INSIDE" : "VISITOR PASS"}
        </span>
        <span className="font-mono text-sm font-semibold text-foreground">{passId}</span>
      </div>

      {isExitMode && currentVisitor ? (
        <>
          <div className="rounded-xl border border-border/60 bg-background/40 p-5">
            <h2 className="font-heading text-2xl font-semibold">{currentVisitor.name}</h2>
            <p className="font-mono text-xs text-muted-foreground">{currentVisitor.nicNumber}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Item label="Company" value={currentVisitor.company || "—"} />
              <Item label="Contact Person" value={currentVisitor.contactPerson || "—"} />
              <Item label="Purpose" value={currentVisitor.purpose || "—"} span />
              <Item label="Entered" value={new Date(currentVisitor.enteredAt).toLocaleString("en-GB")} span />
            </dl>
          </div>
          <Button
            type="button"
            disabled={pending}
            onClick={() => (confirmExit ? submitExit() : setConfirmExit(true))}
            className="mt-auto h-20 rounded-2xl bg-red-600 text-2xl font-bold tracking-wide text-white ring-1 ring-red-500/40 shadow-lg shadow-red-600/30 hover:bg-red-500 active:scale-[0.98]"
          >
            {pending
              ? <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Releasing…</>
              : <><ArrowUpFromLine className="mr-3 h-7 w-7" /> {confirmExit ? "TAP AGAIN TO CONFIRM" : "MARK OUT — Allow Exit"}</>}
          </Button>
        </>
      ) : (
        <form onSubmit={handleSubmit(submitEntry)} className="flex flex-1 flex-col gap-4">
          <Field id="name" label="Visitor Name" error={errors.name?.message}>
            <Input id="name" {...register("name")} className="h-12 text-base" placeholder="Full name" />
          </Field>
          <Field id="nicNumber" label="NIC Number" error={errors.nicNumber?.message}>
            <Input id="nicNumber" {...register("nicNumber")} className="h-12 font-mono text-base uppercase" placeholder="952341234V or 199523401234" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="company" label="Company" error={errors.company?.message}>
              <Input id="company" {...register("company")} className="h-11" />
            </Field>
            <Field id="contactPerson" label="Contact Person" error={errors.contactPerson?.message}>
              <Input id="contactPerson" {...register("contactPerson")} className="h-11" />
            </Field>
          </div>
          <Field id="purpose" label="Purpose" error={errors.purpose?.message}>
            <Input id="purpose" {...register("purpose")} className="h-11" placeholder="Meeting / Delivery / Audit / …" />
          </Field>

          <Button
            type="submit"
            disabled={pending}
            className="mt-auto h-20 rounded-2xl bg-emerald-600 text-2xl font-bold tracking-wide text-white ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 active:scale-[0.98]"
          >
            {pending
              ? <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Recording…</>
              : <><UserPlus className="mr-3 h-7 w-7" /> MARK IN — Allow Entry</>}
          </Button>
        </form>
      )}
    </div>
  );
}

function Item({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div className={span ? "col-span-2" : ""}>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function Field({
  id, label, error, children,
}: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
