import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { VehicleModel } from "@/models/Vehicle";
import { PermanentEmployeeModel } from "@/models/PermanentEmployee";
import { MovementLogModel } from "@/models/MovementLog";
import { requireRole, jsonError } from "@/lib/api";
import { logAction } from "@/lib/auditLogger";
import { SCAN_DIRECTIONS, SCAN_METHODS } from "@/types";

export const runtime = "nodejs";

const bodySchema = z.object({
  entityType: z.enum(["EMPLOYEE", "VEHICLE", "PERMANENT"]),
  entityId: z.string().min(1),
  direction: z.enum(SCAN_DIRECTIONS),
  gateLocation: z.string().default("Main Gate"),
  scanMethod: z.enum(SCAN_METHODS).default("QR_SCANNER"),
});

export async function POST(req: Request) {
  const guard = await requireRole(["SECURITY_OFFICER", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid payload", 422);

  const { entityType, entityId, direction, gateLocation, scanMethod } = parsed.data;
  if (!mongoose.Types.ObjectId.isValid(entityId)) return jsonError("Invalid entityId", 400);

  await connectDB();
  const officerId = new mongoose.Types.ObjectId(guard.session.user.id);
  const officerName = guard.session.user.name ?? "Officer";
  const now = new Date();

  if (entityType === "EMPLOYEE") {
    const emp = await EmployeeModel.findById(entityId);
    if (!emp) return jsonError("Employee not found", 404);
    if (emp.status !== "ACTIVE") return jsonError("Employee is not active", 409);
    if (emp.currentStatus === direction) {
      return jsonError(`Employee is already ${direction}`, 409);
    }

    emp.currentStatus = direction;
    emp.lastScanAt = now;
    await emp.save();

    await MovementLogModel.create({
      entityType: "EMPLOYEE",
      employeeId: emp._id,
      entityName: emp.name,
      entityIdentifier: emp.nicNumber,
      contractorId: emp.contractorId,
      companyName: emp.companyName,
      direction,
      scannedAt: now,
      gateLocation,
      scannedBy: officerId,
      scannedByName: officerName,
      scanMethod,
    });

    void logAction({
      userId: guard.session.user.id, userName: officerName,
      userEmail: guard.session.user.email ?? "", userRole: guard.session.user.role,
      action: direction === "IN" ? "SCAN_IN" : "SCAN_OUT",
      entityType: "Employee", entityId: String(emp._id),
      description: `${direction} · ${emp.name} (${emp.nicNumber}) @ ${gateLocation}`,
      request: req,
    });

    return NextResponse.json({ ok: true, currentStatus: emp.currentStatus });
  }

  /* PERMANENT EMPLOYEE */
  if (entityType === "PERMANENT") {
    const perm = await PermanentEmployeeModel.findById(entityId);
    if (!perm) return jsonError("Permanent employee not found", 404);
    if (perm.currentStatus === direction) {
      return jsonError(`Already ${direction}`, 409);
    }

    perm.currentStatus = direction;
    perm.lastScanAt = now;
    await perm.save();

    await MovementLogModel.create({
      entityType: "PERMANENT",
      permanentEmployeeId: perm._id,
      entityName: perm.name,
      entityIdentifier: perm.permanentId || perm.nicNumber,
      companyName: "Sahasdhanavi (Permanent)",
      direction,
      scannedAt: now,
      gateLocation,
      scannedBy: officerId,
      scannedByName: officerName,
      scanMethod,
    });

    void logAction({
      userId: guard.session.user.id, userName: officerName,
      userEmail: guard.session.user.email ?? "", userRole: guard.session.user.role,
      action: direction === "IN" ? "SCAN_IN" : "SCAN_OUT",
      entityType: "PermanentEmployee", entityId: String(perm._id),
      description: `${direction} · ${perm.name} (${perm.permanentId}) @ ${gateLocation}`,
      request: req,
    });

    return NextResponse.json({ ok: true, currentStatus: perm.currentStatus });
  }

  /* VEHICLE */
  const veh = await VehicleModel.findById(entityId);
  if (!veh) return jsonError("Vehicle not found", 404);
  if (veh.status === "BLOCKED") return jsonError("Vehicle is BLOCKED", 409);
  if (veh.currentStatus === direction) {
    return jsonError(`Vehicle is already ${direction}`, 409);
  }

  veh.currentStatus = direction;
  veh.lastScanAt = now;
  await veh.save();

  await MovementLogModel.create({
    entityType: "VEHICLE",
    vehicleId: veh._id,
    entityName: veh.vehicleNumber,
    entityIdentifier: veh.vehicleNumber,
    contractorId: veh.contractorId,
    companyName: veh.companyName,
    direction,
    scannedAt: now,
    gateLocation,
    scannedBy: officerId,
    scannedByName: officerName,
    scanMethod,
  });

  void logAction({
    userId: guard.session.user.id, userName: officerName,
    userEmail: guard.session.user.email ?? "", userRole: guard.session.user.role,
    action: direction === "IN" ? "SCAN_IN" : "SCAN_OUT",
    entityType: "Vehicle", entityId: String(veh._id),
    description: `${direction} · vehicle ${veh.vehicleNumber} @ ${gateLocation}`,
    request: req,
  });

  return NextResponse.json({ ok: true, currentStatus: veh.currentStatus });
}
