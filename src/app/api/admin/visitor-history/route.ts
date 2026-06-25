import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { VisitorModel } from "@/models/Visitor";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const passId = searchParams.get("passId")?.trim();
  const company = searchParams.get("company")?.trim();
  const status = searchParams.get("status");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const filter: Record<string, unknown> = {};
  if (passId) filter.visitorPassId = passId.toUpperCase();
  if (company) filter.company = { $regex: company, $options: "i" };
  if (status === "IN" || status === "OUT" || status === "COMPLETED") filter.currentStatus = status;
  if (startDate || endDate) {
    const range: Record<string, Date> = {};
    if (startDate) range.$gte = new Date(startDate);
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      range.$lte = e;
    }
    filter.enteredAt = range;
  }

  await connectDB();
  const docs = await VisitorModel.find(filter)
    .sort({ enteredAt: -1 })
    .limit(1000)
    .lean();

  return NextResponse.json({
    items: docs.map((d) => ({
      id: String(d._id),
      visitorPassId: d.visitorPassId,
      name: d.name,
      nicNumber: d.nicNumber,
      company: d.company,
      purpose: d.purpose,
      contactPerson: d.contactPerson,
      currentStatus: d.currentStatus,
      enteredAt: d.enteredAt,
      exitedAt: d.exitedAt,
      durationMs:
        d.exitedAt ? new Date(d.exitedAt).getTime() - new Date(d.enteredAt).getTime() : null,
    })),
  });
}
