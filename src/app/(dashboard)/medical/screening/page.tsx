import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { ScreeningWorkstation } from "@/components/medical/ScreeningWorkstation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Medical Screening" };

export default function MedicalScreeningPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Medical Officer"
          title="Medical Screening Workstation"
          description="Type or scan an NIC, review the employee, then mark PASSED or FAILED."
        />
      </MotionWrapper>
      <MotionWrapper delay={0.05}>
        <ScreeningWorkstation />
      </MotionWrapper>
    </div>
  );
}
