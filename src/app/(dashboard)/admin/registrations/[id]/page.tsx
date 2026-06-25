import { notFound } from "next/navigation";
import Link from "next/link";
import mongoose from "mongoose";
import { ArrowLeft } from "lucide-react";

import { connectDB } from "@/lib/db";
import { ContractorRegistrationModel } from "@/models/ContractorRegistration";
import { RegistrationDetailView } from "@/components/admin/RegistrationDetailView";

export const dynamic = "force-dynamic";

export default async function RegistrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) notFound();

  await connectDB();
  const doc = await ContractorRegistrationModel.findById(id).lean();
  if (!doc) notFound();

  const item = {
    id: String(doc._id),
    companyName: doc.companyName,
    email: doc.email,
    brNumber: doc.brNumber,
    contactNumber: doc.contactNumber,
    poNumber: doc.poNumber,
    officeAddress: doc.officeAddress,
    scopeOfWork: doc.scopeOfWork,
    hasSafetyPlan: doc.hasSafetyPlan,
    hasContractorManagementDocs: doc.hasContractorManagementDocs,
    safetyPlanDocId: doc.safetyPlanDocId ? String(doc.safetyPlanDocId) : null,
    cmdDocId: doc.cmdDocId ? String(doc.cmdDocId) : null,
    labourList: doc.labourList.map((l) => ({
      name: l.name, nicNumber: l.nicNumber, address: l.address,
      mobileNumber: l.mobileNumber, emergencyContact: l.emergencyContact,
      tradeType: l.tradeType, designation: l.designation,
      joinedDate: new Date(l.joinedDate).toISOString(),
    })),
    vehicles: doc.vehicles.map((v) => ({
      vehicleNumber: v.vehicleNumber, vehicleType: v.vehicleType,
      vehicleColour: v.vehicleColour, vehiclePurpose: v.vehiclePurpose,
    })),
    electricalEquipment: doc.electricalEquipment.map((e) => ({
      toolName: e.toolName, category: e.category, quantity: e.quantity,
      serialNumber: e.serialNumber, powerDetails: e.powerDetails,
    })),
    nonElectricalTools: doc.nonElectricalTools.map((t) => ({
      toolName: t.toolName, category: t.category, quantity: t.quantity, unit: t.unit,
    })),
    status: doc.status,
    adminNotes: doc.adminNotes,
    submittedAt: new Date(doc.submittedAt).toISOString(),
    contractorAccountCreated: doc.contractorAccountCreated,
  };

  return (
    <div className="space-y-4">
      <Link
        href="/admin/registrations"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to registrations
      </Link>
      <RegistrationDetailView item={item} />
    </div>
  );
}
