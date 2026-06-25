import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { AdditionalRequestModel } from "@/models/AdditionalRequest";
import { requireRole, jsonError } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(["SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;
  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  await connectDB();
  const doc = await AdditionalRequestModel.findById(id).lean();
  if (!doc) return jsonError("Not found", 404);

  return NextResponse.json({ item: { ...doc, id: String(doc._id) } });
}
