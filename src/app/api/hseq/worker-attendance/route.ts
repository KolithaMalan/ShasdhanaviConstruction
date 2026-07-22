import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { MovementLogModel } from "@/models/MovementLog";
import { WorkerGateVisitModel } from "@/models/WorkerGateVisit";
import { requireRole } from "@/lib/api";
import { WORKER_COMPANIES, type WorkerCompany } from "@/types";

export const runtime = "nodejs";

/** Nuwan (view) + Dinesh + Super Admin. */
export async function GET(req: Request) {
  const guard = await requireRole(["ADMIN_HSEQ", "HSEQ_OFFICER", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const company = searchParams.get("company")?.trim();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const moveFilter: Record<string, unknown> = { entityType: "WORKER" };
  if (company && WORKER_COMPANIES.includes(company as WorkerCompany)) {
    moveFilter.companyName = company;
  }
  if (q) {
    moveFilter.$or = [
      { entityName: { $regex: q, $options: "i" } },
      { entityIdentifier: { $regex: q, $options: "i" } },
    ];
  }

  const visitFilter: Record<string, unknown> = { status: "OPEN" };
  if (company && WORKER_COMPANIES.includes(company as WorkerCompany)) {
    visitFilter.company = company;
  }

  await connectDB();
  const [movements, openVisits, todayIn, todayOut] = await Promise.all([
    MovementLogModel.find(moveFilter).sort({ scannedAt: -1 }).limit(300).lean(),
    WorkerGateVisitModel.find(visitFilter).sort({ checkInAt: -1 }).limit(300).lean(),
    MovementLogModel.countDocuments({ entityType: "WORKER", direction: "IN", scannedAt: { $gte: startOfDay } }),
    MovementLogModel.countDocuments({ entityType: "WORKER", direction: "OUT", scannedAt: { $gte: startOfDay } }),
  ]);

  return NextResponse.json({
    todayIn,
    todayOut,
    insideNow: openVisits.length,
    movements: movements.map((m) => ({
      id: String(m._id),
      workerName: m.entityName,
      workerCode: m.entityIdentifier,
      company: m.companyName ?? "",
      direction: m.direction,
      scannedAt: m.scannedAt ? new Date(m.scannedAt).toISOString() : null,
      gateLocation: m.gateLocation ?? "",
      scannedByName: m.scannedByName ?? "",
    })),
    openVisits: openVisits.map((v) => ({
      id: String(v._id),
      workerName: v.workerName,
      workerCode: v.workerCode ?? "",
      company: v.company ?? "",
      items: (v.items ?? []).map((i) => i.name ?? "").filter(Boolean),
      checkInAt: v.checkInAt ? new Date(v.checkInAt).toISOString() : null,
    })),
  });
}
