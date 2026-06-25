import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { BlacklistedNICModel } from "@/models/BlacklistedNIC";
import { requireRole, jsonError } from "@/lib/api";

export const runtime = "nodejs";

const bodySchema = z.object({
  reason: z.string().min(3, "Reason is required").max(800),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(["MEDICAL_OFFICER", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return jsonError("Reason is required", 422);

  await connectDB();
  const doc = await EmployeeModel.findById(id);
  if (!doc) return jsonError("Not found", 404);
  if (doc.status !== "PENDING_MEDICAL") {
    return jsonError("Employee is not pending medical", 409);
  }

  doc.status = "MEDICAL_REJECTED";
  doc.medicalStatus = "FAILED";
  doc.medicalRejectionReason = parsed.data.reason;
  doc.medicalScreenedAt = new Date();
  doc.medicalScreenedBy = new mongoose.Types.ObjectId(guard.session.user.id);
  await doc.save();

  /* Blacklist the NIC so the same person can't be re-registered. */
  await BlacklistedNICModel.updateOne(
    { nicNumber: doc.nicNumber },
    {
      $setOnInsert: {
        nicNumber: doc.nicNumber,
        name: doc.name,
        reason: parsed.data.reason,
        blacklistedBy: new mongoose.Types.ObjectId(guard.session.user.id),
        blacklistedAt: new Date(),
        originalContractorId: doc.contractorId,
        originalCompanyName: doc.companyName,
      },
    },
    { upsert: true },
  );

  return NextResponse.json({ ok: true });
}
