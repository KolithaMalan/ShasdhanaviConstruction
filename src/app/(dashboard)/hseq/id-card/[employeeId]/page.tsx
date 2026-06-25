import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { serializeEmployee } from "@/lib/employee";
import { qrPngDataUrl } from "@/lib/qr";

import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { IdCardVisual } from "@/components/idcard/IdCardVisual";
import { IdCardActions } from "@/components/idcard/IdCardActions";

export const dynamic = "force-dynamic";

export default async function IdCardPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  await connectDB();
  const doc = await EmployeeModel.findOne({ employeeId }).lean();
  if (!doc || !doc.qrCodeData) notFound();

  const employee = serializeEmployee(doc);
  const qrDataUrl = await qrPngDataUrl(doc.qrCodeData);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/hseq/induction"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground print:hidden"
      >
        <ArrowLeft className="h-4 w-4" /> Back to induction
      </Link>

      <MotionWrapper>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-md print:border-none print:bg-transparent">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[--color-brand-ocean]">
            ID Card · {employee.employeeId}
          </p>
          <h1 className="mt-1 font-heading text-2xl font-semibold">{employee.name}</h1>
          <p className="text-sm text-muted-foreground">
            Valid until {employee.idCardExpiresAt ? new Date(employee.idCardExpiresAt).toLocaleDateString("en-GB") : "—"}
          </p>
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <div className="rounded-2xl border border-border/60 bg-[--color-brand-mint]/20 p-8 backdrop-blur-md print:border-none print:bg-transparent print:p-0">
          <IdCardVisual employee={employee} qrDataUrl={qrDataUrl} />
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.08}>
        <IdCardActions employeeId={employee.employeeId ?? ""} />
      </MotionWrapper>
    </div>
  );
}
