import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { IdVerifyWorkstation } from "@/components/hseq/IdVerifyWorkstation";

export const metadata = { title: "Verify ID" };

export default function AdminVerifyIdPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Admin · Site Visit"
          title="Verify ID"
          description="Scan anyone's ID card QR during a site walk to confirm who they are. This is a check only — it does not record an IN or OUT movement."
        />
      </MotionWrapper>
      <MotionWrapper delay={0.05}>
        <IdVerifyWorkstation />
      </MotionWrapper>
    </div>
  );
}
