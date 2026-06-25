import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import mongoose from "mongoose";
import { ArrowLeft } from "lucide-react";

import { connectDB } from "@/lib/db";
import { ContractorRegistrationModel } from "@/models/ContractorRegistration";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { CreateAccountCard } from "@/components/admin/CreateAccountCard";

export const dynamic = "force-dynamic";

export default async function CreateContractorAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) notFound();

  await connectDB();
  const reg = await ContractorRegistrationModel.findById(id).lean();
  if (!reg) notFound();
  if (reg.status !== "APPROVED") {
    redirect(`/admin/registrations/${id}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/admin/registrations/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to registration
      </Link>

      <MotionWrapper>
        <PageHeader
          eyebrow="Account Creation"
          title="Onboard contractor"
          description={
            reg.contractorAccountCreated
              ? "An account has already been created for this registration."
              : "Generate a temporary password and email the contractor their credentials."
          }
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        {reg.contractorAccountCreated ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
            <p className="text-sm text-foreground">
              The contractor account for <strong>{reg.companyName}</strong> ({reg.email}) was already created.
              No further action needed.
            </p>
          </div>
        ) : (
          <CreateAccountCard
            registrationId={String(reg._id)}
            companyName={reg.companyName}
            email={reg.email}
            brNumber={reg.brNumber}
          />
        )}
      </MotionWrapper>
    </div>
  );
}
