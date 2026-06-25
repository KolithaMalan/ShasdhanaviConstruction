import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { ContractorRegistrationModel } from "@/models/ContractorRegistration";
import { reviewActionSchema } from "@/lib/validators";
import { notifyContractorRejection } from "@/lib/email";
import { requireRole, jsonError } from "@/lib/api";

export const runtime = "nodejs";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(["SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  const body = await req.json().catch(() => ({}));
  const parsed = reviewActionSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid payload", 422);

  await connectDB();
  const doc = await ContractorRegistrationModel.findById(id);
  if (!doc) return jsonError("Not found", 404);

  doc.status = "CORRECTIONS_REQUESTED";
  doc.adminNotes = parsed.data.notes;
  doc.reviewedAt = new Date();
  doc.reviewedBy = new mongoose.Types.ObjectId(guard.session.user.id);
  await doc.save();

  void notifyContractorRejection({
    to: doc.email,
    companyName: doc.companyName,
    reason: parsed.data.notes || "Please contact the Admin team.",
    mode: "CORRECTIONS_REQUESTED",
  });

  return NextResponse.json({ ok: true });
}
