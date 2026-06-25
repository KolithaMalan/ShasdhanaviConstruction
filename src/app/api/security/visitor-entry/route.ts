import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { VisitorModel } from "@/models/Visitor";
import { VisitorPassModel } from "@/models/VisitorPass";
import { MovementLogModel } from "@/models/MovementLog";
import { nicSchema } from "@/lib/validators";
import { requireRole, jsonError } from "@/lib/api";
import { SCAN_METHODS } from "@/types";

export const runtime = "nodejs";

const bodySchema = z.object({
  passId: z.string().min(1),
  name: z.string().min(2, "Name is required").max(120),
  nicNumber: nicSchema,
  company: z.string().max(160).default(""),
  purpose: z.string().max(400).default(""),
  contactPerson: z.string().max(160).default(""),
  gateLocation: z.string().default("Main Gate"),
  scanMethod: z.enum(SCAN_METHODS).default("QR_SCANNER"),
});

export async function POST(req: Request) {
  const guard = await requireRole(["SECURITY_OFFICER", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid payload", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { passId, name, nicNumber, company, purpose, contactPerson, gateLocation, scanMethod } = parsed.data;

  await connectDB();
  const pass = await VisitorPassModel.findOne({ passId: passId.toUpperCase() });
  if (!pass) return jsonError("Visitor pass not found", 404);
  if (pass.currentStatus !== "AVAILABLE") {
    return jsonError("Visitor pass is already in use", 409);
  }

  const now = new Date();
  const officerId = new mongoose.Types.ObjectId(guard.session.user.id);
  const officerName = guard.session.user.name ?? "Officer";

  const visitor = await VisitorModel.create({
    visitorPassId: pass.passId,
    name,
    nicNumber: nicNumber.toUpperCase(),
    company,
    purpose,
    contactPerson,
    currentStatus: "IN",
    enteredAt: now,
    enteredBy: officerId,
  });

  pass.currentStatus = "IN_USE";
  pass.currentVisitorId = visitor._id;
  await pass.save();

  await MovementLogModel.create({
    entityType: "VISITOR",
    visitorId: visitor._id,
    entityName: visitor.name,
    entityIdentifier: visitor.nicNumber,
    companyName: visitor.company,
    direction: "IN",
    scannedAt: now,
    gateLocation,
    scannedBy: officerId,
    scannedByName: officerName,
    scanMethod,
  });

  return NextResponse.json({ ok: true, visitorId: String(visitor._id) });
}
