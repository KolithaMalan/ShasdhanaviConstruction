"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Step1Company } from "@/components/registration/Step1Company";
import type { CompanyInput } from "@/lib/validators";

const blankCompany: CompanyInput = {
  companyName: "",
  email: "",
  brNumber: "",
  officeAddress: "",
  contactNumber: "",
  poNumber: "",
  scopeOfWork: "",
  hasSafetyPlan: false,
  hasContractorManagementDocs: false,
  safetyPlanDocId: "",
  cmdDocId: null,
};

export function RegistrationForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [company, setCompany] = useState<CompanyInput>(blankCompany);

  async function handleSubmit(data: CompanyInput) {
    setCompany(data);
    startTransition(async () => {
      try {
        // Labour, vehicles, electrical and non-electrical items are added by the
        // contractor after approval, so registration submits company details only.
        const payload = {
          ...data,
          labourList: [],
          vehicles: [],
          electricalEquipment: [],
          nonElectricalTools: [],
        };
        const res = await fetch("/api/contractor-registration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message ?? "Submission failed");
        }
        toast.success("Registration submitted", {
          description: "We'll email you as soon as the Admin team responds.",
        });
        router.push("/contractor-registration/success");
      } catch (err) {
        toast.error("Submission failed", {
          description: err instanceof Error ? err.message : "Please try again.",
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md sm:p-8">
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[--color-brand-ocean]">
          Contractor Registration
        </p>
        <p className="mb-6 font-heading text-2xl font-semibold tracking-tight">
          Company Details
        </p>

        <Step1Company
          defaults={company}
          onNext={handleSubmit}
          submitting={pending}
          submitLabel="Submit Registration"
        />
      </div>
    </div>
  );
}
