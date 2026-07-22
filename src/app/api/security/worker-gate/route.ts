import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { WorkerModel } from "@/models/Worker";
import { WorkerGateVisitModel } from "@/models/WorkerGateVisit";
import { MovementLogModel } from "@/models/MovementLog";
import { requireRole, jsonError } from "@/lib/api";
import { requireFeature } from "@/lib/featureService";
import { logAction } from "@/lib/auditLogger";
import { SCAN_METHODS } from "@/types";

export const runtime = "nodejs";

const itemSchema = z.object({ name: z.string().trim().min(1).max(120) });

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("IN"),
    workerId: z.string().min(1),
    items: z.array(itemSchema).default([]),
    gateLocation: z.string().default("Main Gate"),
    scanMethod: z.enum(SCAN_METHODS).default("QR_SCANNER"),
  }),
  z.object({
    action: z.literal("OUT"),
    workerId: z.string().min(1),
    itemsTakenOut: z.array(itemSchema).default([]),
    /** true → final departure: close & archive the item record as history.
     *  false → temporary exit (e.g. lunch): keep the record OPEN so the morning
     *  items still show on the next OUT/IN. */
    final: z.boolean().default(false),
    gateLocation: z.string().default("Main Gate"),
    scanMethod: z.enum(SCAN_METHODS).default("QR_SCANNER"),
  }),
]);

export async function POST(req: Request) {
  const guard = await requireRole(["SECURITY_OFFICER", "HSEQ_OFFICER", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const blocked = await requireFeature(guard.session.user.role, "action:gate.scan");
  if (blocked) return blocked;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid payload", 422);

  const data = parsed.data;
  if (!mongoose.Types.ObjectId.isValid(data.workerId)) return jsonError("Invalid workerId", 400);

  await connectDB();
  const worker = await WorkerModel.findById(data.workerId);
  if (!worker) return jsonError("Worker not found", 404);

  const officerId = new mongoose.Types.ObjectId(guard.session.user.id);
  const officerName = guard.session.user.name ?? "Officer";
  const now = new Date();
  const direction = data.action; // "IN" | "OUT"

  if (worker.currentStatus === direction) {
    return jsonError(`Worker is already ${direction}`, 409);
  }

  /* Attendance is ALWAYS recorded, independent of item tracking. */
  worker.currentStatus = direction;
  worker.lastScanAt = now;
  await worker.save();

  await MovementLogModel.create({
    entityType: "WORKER",
    workerId: worker._id,
    entityName: worker.name,
    entityIdentifier: worker.workerId || worker.nicNumber,
    companyName: worker.company,
    direction,
    scannedAt: now,
    gateLocation: data.gateLocation,
    scannedBy: officerId,
    scannedByName: officerName,
    scanMethod: data.scanMethod,
  });

  let visitInfo: unknown = null;

  if (data.action === "IN") {
    /* Reuse an OPEN record (lunch re-entry) — never overwrite the morning
       items. Anything the worker brings back with them is APPENDED, so the
       OUT check still covers everything they carried in today. */
    let visit = await WorkerGateVisitModel.findOne({ workerId: worker._id, status: "OPEN" });
    if (!visit) {
      visit = await WorkerGateVisitModel.create({
        workerId: worker._id,
        workerName: worker.name,
        workerCode: worker.workerId ?? "",
        company: worker.company,
        items: data.items.map((i) => ({ name: i.name, addedAt: now })),
        status: "OPEN",
        checkInAt: now,
        gateLocation: data.gateLocation,
        recordedBy: officerId,
        recordedByName: officerName,
      });
    } else if (data.items.length > 0) {
      visit.set({
        items: [
          ...(visit.items ?? []).map((i) => ({ name: i.name, addedAt: i.addedAt })),
          ...data.items.map((i) => ({ name: i.name, addedAt: now })),
        ],
      });
      await visit.save();
    }
    visitInfo = {
      id: String(visit._id),
      items: (visit.items ?? []).map((i) => ({ name: i.name ?? "" })),
    };
  } else {
    /* OUT — verify items against the open record. */
    const visit = await WorkerGateVisitModel.findOne({ workerId: worker._id, status: "OPEN" });
    if (visit) {
      if (data.final) {
        /* Final departure — archive the record as history with verified items.
           `set` is used so Mongoose casts the plain objects into the
           itemsOutVerified DocumentArray. */
        visit.set({
          itemsOutVerified: data.itemsTakenOut,
          checkOutAt: now,
          status: "CLOSED",
        });
        await visit.save();
        visitInfo = { id: String(visit._id), status: "CLOSED" };
      } else {
        // Temporary exit (lunch) — keep the record OPEN; attendance only.
        visitInfo = { id: String(visit._id), status: "OPEN" };
      }
    }
  }

  void logAction({
    userId: guard.session.user.id,
    userName: officerName,
    userEmail: guard.session.user.email ?? "",
    userRole: guard.session.user.role,
    action: direction === "IN" ? "SCAN_IN" : "SCAN_OUT",
    entityType: "Worker",
    entityId: String(worker._id),
    description:
      `${direction} · ${worker.company} worker ${worker.name} (${worker.workerId}) @ ${data.gateLocation}` +
      (data.action === "IN" && data.items.length
        ? ` · items in: ${data.items.map((i) => i.name).join(", ")}`
        : data.action === "OUT" && data.itemsTakenOut.length
          ? ` · items out: ${data.itemsTakenOut.map((i) => i.name).join(", ")}`
          : ""),
    request: req,
  });

  return NextResponse.json({ ok: true, currentStatus: worker.currentStatus, visit: visitInfo });
}
