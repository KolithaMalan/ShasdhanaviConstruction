import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { computeIdCardExpiry } from "@/lib/employee";
import { requireRole, jsonError } from "@/lib/api";

export const runtime = "nodejs";

export async function PATCH(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(["SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  await connectDB();
  const doc = await EmployeeModel.findById(id);
  if (!doc) return jsonError("Not found", 404);
  if (doc.status !== "DEACTIVATED") return jsonError("Employee is not deactivated", 409);

  const now = new Date();
  doc.status = "ACTIVE";
  doc.idCardIssuedAt = now;
  doc.idCardExpiresAt = computeIdCardExpiry(now);
  doc.idCardActivatedBy = new mongoose.Types.ObjectId(guard.session.user.id);
  await doc.save();

  return NextResponse.json({ ok: true });
}
