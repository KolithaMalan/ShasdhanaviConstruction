import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { InductionWorkstation } from "@/components/hseq/InductionWorkstation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Induction Workstation" };

export default function HseqInductionPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="HSEQ Officer"
          title="Induction Workstation"
          description="Capture employee photos and issue site ID cards in two clicks."
        />
      </MotionWrapper>
      <MotionWrapper delay={0.05}>
        <InductionWorkstation />
      </MotionWrapper>
    </div>
  );
}
