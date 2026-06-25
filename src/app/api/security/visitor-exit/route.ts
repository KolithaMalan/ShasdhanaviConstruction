import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { VisitorModel } from "@/models/Visitor";
import { VisitorPassModel } from "@/models/VisitorPass";
import { MovementLogModel } from "@/models/MovementLog";
import { requireRole, jsonError } from "@/lib/api";
import { SCAN_METHODS } from "@/types";

export const runtime = "nodejs";

const bodySchema = z.object({
  passId: z.string().min(1),
  gateLocation: z.string().default("Main Gate"),
  scanMethod: z.enum(SCAN_METHODS).default("QR_SCANNER"),
});

export async function POST(req: Request) {
  const guard = await requireRole(["SECURITY_OFFICER", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid payload", 422);

  await connectDB();
  const pass = await VisitorPassModel.findOne({ passId: parsed.data.passId.toUpperCase() });
  if (!pass) return jsonError("Visitor pass not found", 404);
  if (pass.currentStatus !== "IN_USE" || !pass.currentVisitorId) {
    return jsonError("No active visitor on this pass", 409);
  }

  const visitor = await VisitorModel.findById(pass.currentVisitorId);
  if (!visitor) {
    // Pass thinks it has a visitor but the visitor record is gone — recover.
    pass.currentStatus = "AVAILABLE";
    pass.currentVisitorId = null;
    await pass.save();
    return jsonError("Visitor record missing — pass reset", 410);
  }

  const now = new Date();
  const officerId = new mongoose.Types.ObjectId(guard.session.user.id);
  const officerName = guard.session.user.name ?? "Officer";

  visitor.currentStatus = "COMPLETED";
  visitor.exitedAt = now;
  visitor.exitedBy = officerId;
  await visitor.save();

  pass.currentStatus = "AVAILABLE";
  pass.currentVisitorId = null;
  await pass.save();

  await MovementLogModel.create({
    entityType: "VISITOR",
    visitorId: visitor._id,
    entityName: visitor.name,
    entityIdentifier: visitor.nicNumber,
    companyName: visitor.company,
    direction: "OUT",
    scannedAt: now,
    gateLocation: parsed.data.gateLocation,
    scannedBy: officerId,
    scannedByName: officerName,
    scanMethod: parsed.data.scanMethod,
  });

  return NextResponse.json({ ok: true });
}
