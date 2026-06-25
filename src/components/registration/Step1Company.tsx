"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DocumentUploadField } from "@/components/registration/DocumentUploadField";
import { companySchema, type CompanyInput } from "@/lib/validators";
import { cn } from "@/lib/utils";

interface Step1Props {
  defaults: CompanyInput;
  onNext: (data: CompanyInput) => void;
}

export function Step1Company({ defaults, onNext }: Step1Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
    defaultValues: defaults,
    mode: "onBlur",
  });

  const email = watch("email") ?? "";
  const safetyPlanDocId = watch("safetyPlanDocId");
  const cmdDocId = watch("cmdDocId");

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[--color-brand-ocean] to-[--color-brand-sky] text-white">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-heading text-xl font-semibold">Company Details</h2>
          <p className="text-sm text-muted-foreground">
            Tell us about your company. All fields are required unless marked optional.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field
          id="companyName"
          label="Company Name"
          error={errors.companyName?.message}
        >
          <Input id="companyName" placeholder="e.g. Acme Construction Pvt Ltd"
                 {...register("companyName")} />
        </Field>

        <Field id="email" label="Contact Email" error={errors.email?.message}
               helper="Login credentials will be sent here once approved.">
          <Input id="email" type="email" placeholder="contracts@acme.lk"
                 {...register("email")} />
        </Field>

        <Field id="brNumber" label="Business Registration No."
               error={errors.brNumber?.message}>
          <Input id="brNumber" placeholder="PV/123456" {...register("brNumber")} />
        </Field>

        <Field id="contactNumber" label="Contact Number"
               error={errors.contactNumber?.message}>
          <Input id="contactNumber" placeholder="+94 71 234 5678"
                 {...register("contactNumber")} />
        </Field>

        <Field id="poNumber" label="Purchase Order Number"
               error={errors.poNumber?.message}>
          <Input id="poNumber" placeholder="PO-2026-0091" {...register("poNumber")} />
        </Field>

        <Field id="officeAddress" label="Office Address" className="md:col-span-1"
               error={errors.officeAddress?.message}>
          <Input id="officeAddress" placeholder="No. 12, Galle Road, Colombo"
                 {...register("officeAddress")} />
        </Field>

        <Field id="scopeOfWork" label="Scope of Work" className="md:col-span-2"
               error={errors.scopeOfWork?.message}
               helper="Describe the work your company will perform on the site.">
          <Textarea id="scopeOfWork" rows={4}
                    placeholder="e.g. Mechanical fitting and pipe-work for the cooling tower section."
                    {...register("scopeOfWork")} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DocumentUploadField
          kind="SAFETY_PLAN"
          required
          label="Safety Plans"
          description="Upload your written safety plans for the work scope (PDF / Word / image, up to 10 MB)."
          documentId={safetyPlanDocId}
          uploaderEmail={email}
          onUploaded={(id) => {
            setValue("safetyPlanDocId", id, { shouldDirty: true, shouldValidate: true });
            setValue("hasSafetyPlan", true);
          }}
          onCleared={() => {
            setValue("safetyPlanDocId", "", { shouldDirty: true, shouldValidate: true });
            setValue("hasSafetyPlan", false);
          }}
          error={errors.safetyPlanDocId?.message}
        />
        <DocumentUploadField
          kind="CMD"
          label="Contractor Management Documents"
          description="Optional — upload your approved CMD bundle if available."
          documentId={cmdDocId ?? ""}
          uploaderEmail={email}
          onUploaded={(id) => {
            setValue("cmdDocId", id, { shouldDirty: true });
            setValue("hasContractorManagementDocs", true);
          }}
          onCleared={() => {
            setValue("cmdDocId", null, { shouldDirty: true });
            setValue("hasContractorManagementDocs", false);
          }}
          error={errors.cmdDocId?.message}
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          className="h-11 rounded-lg bg-[--color-brand-ocean] px-6 text-white hover:bg-[--color-brand-ocean]/90 active:scale-[0.98]"
        >
          Next: Labour
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
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
