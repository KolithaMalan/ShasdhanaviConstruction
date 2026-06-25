import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { VisitorPassModel } from "@/models/VisitorPass";
import { VisitorModel } from "@/models/Visitor";
import { nextVisitorPassId, buildVisitorPassQr } from "@/lib/visitorPass";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireRole(["SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  await connectDB();
  const passes = await VisitorPassModel.find({}).sort({ passId: 1 }).lean();

  // Pull current visitor info (only for IN_USE passes) in a single batch query
  const visitorIds = passes
    .map((p) => p.currentVisitorId)
    .filter((id): id is NonNullable<typeof id> => !!id);
  const visitors = visitorIds.length
    ? await VisitorModel.find({ _id: { $in: visitorIds } }).select("name nicNumber enteredAt").lean()
    : [];
  const visitorMap = new Map(visitors.map((v) => [String(v._id), v]));

  return NextResponse.json({
    items: passes.map((p) => ({
      id: String(p._id),
      passId: p.passId,
      currentStatus: p.currentStatus,
      currentVisitor: p.currentVisitorId
        ? (() => {
            const v = visitorMap.get(String(p.currentVisitorId));
            return v ? { name: v.name, nicNumber: v.nicNumber, enteredAt: v.enteredAt } : null;
          })()
        : null,
      createdAt: (p as unknown as { createdAt?: Date }).createdAt ?? null,
    })),
  });
}

interface CreateBody { count?: number }

export async function POST(req: Request) {
  const guard = await requireRole(["SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  const body = (await req.json().catch(() => ({}))) as CreateBody;
  const count = Math.max(1, Math.min(50, Number(body.count) || 1));

  await connectDB();
  const created: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const passId = await nextVisitorPassId();
    const doc = await VisitorPassModel.create({
      passId,
      qrCodeData: buildVisitorPassQr(passId),
      currentStatus: "AVAILABLE",
    });
    created.push(doc.passId);
  }
  return NextResponse.json({ ok: true, created });
}
