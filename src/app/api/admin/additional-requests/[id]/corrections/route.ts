import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { AdditionalRequestModel } from "@/models/AdditionalRequest";
import { UserModel } from "@/models/User";
import { reviewActionSchema } from "@/lib/validators";
import { notifyAdditionalRequestRejection } from "@/lib/email";
import { requireRole, jsonError, getBaseUrl } from "@/lib/api";

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
  const doc = await AdditionalRequestModel.findById(id);
  if (!doc) return jsonError("Not found", 404);

  doc.status = "CORRECTIONS_REQUESTED";
  doc.adminNotes = parsed.data.notes;
  doc.reviewedAt = new Date();
  doc.reviewedBy = new mongoose.Types.ObjectId(guard.session.user.id);
  await doc.save();

  const contractor = await UserModel.findById(doc.contractorId);
  if (contractor?.email) {
    void notifyAdditionalRequestRejection({
      to: contractor.email,
      companyName: contractor.companyName ?? contractor.name,
      requestType: doc.requestType,
      reason: parsed.data.notes ?? "",
      mode: "CORRECTIONS_REQUESTED",
      loginUrl: `${getBaseUrl(req)}/contractor`,
    });
  }

  return NextResponse.json({ ok: true });
}
