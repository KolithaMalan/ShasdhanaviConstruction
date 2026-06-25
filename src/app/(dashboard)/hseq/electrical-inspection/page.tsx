import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { ElectricalInspectionWorkstation } from "@/components/hseq/electrical/ElectricalInspectionWorkstation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Electrical Inspection" };

export default function ElectricalInspectionPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="HSEQ Officer"
          title="Electrical Inspection Workstation"
          description="Inspect contractor electrical equipment, pass or fail it, and issue site stickers in seconds."
        />
      </MotionWrapper>
      <MotionWrapper delay={0.05}>
        <ElectricalInspectionWorkstation />
      </MotionWrapper>
    </div>
  );
}
