"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Stepper, type Step } from "@/components/registration/Stepper";
import { Step1Company } from "@/components/registration/Step1Company";
import { LabourEditor } from "@/components/registration/LabourEditor";
import { VehicleEditor } from "@/components/registration/VehicleEditor";
import { ElectricalEquipmentEditor } from "@/components/registration/ElectricalEquipmentEditor";
import { NonElectricalToolEditor } from "@/components/registration/NonElectricalToolEditor";
import { ReviewStep } from "@/components/registration/ReviewStep";
import type {
  CompanyInput,
  ElectricalEquipmentInput,
  LabourInput,
  NonElectricalToolInput,
  RegistrationInput,
  VehicleInput,
} from "@/lib/validators";

const STEPS: Step[] = [
  { id: 1, label: "Company Details",   short: "Company" },
  { id: 2, label: "Labour",            short: "Labour" },
  { id: 3, label: "Vehicles",          short: "Vehicles" },
  { id: 4, label: "Electrical Equip.", short: "Electrical" },
  { id: 5, label: "Non-Electrical",    short: "Tools" },
  { id: 6, label: "Review & Submit",   short: "Review" },
];

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
  const [step, setStep] = useState(1);
  const [completed, setCompleted] = useState<number[]>([]);
  const [pending, startTransition] = useTransition();

  const [company, setCompany] = useState<CompanyInput>(blankCompany);
  const [labour, setLabour] = useState<LabourInput[]>([]);
  const [vehicles, setVehicles] = useState<VehicleInput[]>([]);
  const [electrical, setElectrical] = useState<ElectricalEquipmentInput[]>([]);
  const [tools, setTools] = useState<NonElectricalToolInput[]>([]);

  const fullData: RegistrationInput = {
    ...company,
    labourList: labour,
    vehicles,
    electricalEquipment: electrical,
    nonElectricalTools: tools,
  };

  function markComplete(id: number) {
    setCompleted((c) => (c.includes(id) ? c : [...c, id]));
  }

  function next() {
    markComplete(step);
    setStep((s) => Math.min(STEPS.length, s + 1));
  }
  function prev() {
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleSubmit() {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        try {
          const payload = {
            ...company,
            labourList: labour.map((r) => ({
              ...r,
              joinedDate: r.joinedDate instanceof Date
                ? r.joinedDate.toISOString()
                : new Date(r.joinedDate).toISOString(),
            })),
            vehicles,
            electricalEquipment: electrical,
            nonElectricalTools: tools,
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
        } finally {
          resolve();
        }
      });
    });
  }

  const currentStep = STEPS.find((s) => s.id === step);

  return (
    <div className="space-y-6">
      <Stepper steps={STEPS} current={step} completed={completed} onJump={setStep} />

      <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md sm:p-8">
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[--color-brand-ocean]">
          Step {step} of {STEPS.length}
        </p>
        <p className="mb-6 font-heading text-2xl font-semibold tracking-tight">
          {currentStep?.label}
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step === 1 && (
              <Step1Company
                defaults={company}
                onNext={(data) => {
                  setCompany(data);
                  markComplete(1);
                  setStep(2);
                }}
              />
            )}

            {step === 2 && (
              <div className="space-y-6">
                <LabourEditor rows={labour} onChange={setLabour} />
                <NavRow onPrev={prev} onNext={next} nextLabel="Next: Vehicles" />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <VehicleEditor rows={vehicles} onChange={setVehicles} />
                <NavRow onPrev={prev} onNext={next} nextLabel="Next: Electrical" />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <ElectricalEquipmentEditor rows={electrical} onChange={setElectrical} />
                <NavRow onPrev={prev} onNext={next} nextLabel="Next: Non-Electrical" />
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <NonElectricalToolEditor rows={tools} onChange={setTools} />
                <NavRow onPrev={prev} onNext={next} nextLabel="Next: Review" />
              </div>
            )}

            {step === 6 && (
              <ReviewStep
                data={fullData}
                onEdit={(target) => setStep(target)}
                onSubmit={handleSubmit}
                submitting={pending}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function NavRow({
  onPrev, onNext, nextLabel,
}: { onPrev: () => void; onNext: () => void; nextLabel: string }) {
  return (
    <div className="flex items-center justify-between pt-2">
      <Button type="button" variant="ghost" onClick={onPrev} className="h-11 rounded-lg">
        <ArrowLeft className="mr-2 h-4 w-4" /> Previous
      </Button>
      <Button
        type="button"
        onClick={onNext}
        className="h-11 rounded-lg bg-[--color-brand-ocean] px-6 text-white hover:bg-[--color-brand-ocean]/90 active:scale-[0.98]"
      >
        {nextLabel} <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
