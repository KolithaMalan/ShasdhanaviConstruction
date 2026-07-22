import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { ScanWorkstation } from "@/components/security/ScanWorkstation";

export const metadata = { title: "Gate Scan" };

export default function HseqGateScanPage() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="HSEQ · Gate"
          title="Gate Scan"
          description="Scan worker, permanent-staff, employee, vehicle or visitor passes to record IN/OUT and worker item tracking."
        />
      </MotionWrapper>
      <MotionWrapper delay={0.05}>
        <ScanWorkstation />
      </MotionWrapper>
    </div>
  );
}
