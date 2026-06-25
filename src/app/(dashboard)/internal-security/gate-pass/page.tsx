import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { GatePassWorkstation } from "@/components/internal-security/GatePassWorkstation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gate Pass Processing" };

export default function GatePassPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Internal Security"
          title="Gate Pass Processing"
          description="Process tool movements step-by-step. All changes are committed in a single transaction so inventory never ends up inconsistent."
        />
      </MotionWrapper>
      <MotionWrapper delay={0.05}>
        <GatePassWorkstation />
      </MotionWrapper>
    </div>
  );
}
