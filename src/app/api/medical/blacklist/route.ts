import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { BlacklistedNICModel } from "@/models/BlacklistedNIC";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["MEDICAL_OFFICER", "SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  await connectDB();
  const filter: Record<string, unknown> = {};
  if (q) {
    filter.$or = [
      { nicNumber: { $regex: q.toUpperCase(), $options: "i" } },
      { name: { $regex: q, $options: "i" } },
    ];
  }

  const docs = await BlacklistedNICModel.find(filter)
    .sort({ blacklistedAt: -1 })
    .limit(500)
    .populate("blacklistedBy", "name")
    .lean();

  return NextResponse.json({
    items: docs.map((d) => ({
      id: String(d._id),
      nicNumber: d.nicNumber,
      name: d.name,
      reason: d.reason,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      blacklistedBy: (d.blacklistedBy as any)?.name ?? "—",
      blacklistedAt: d.blacklistedAt,
      originalContractor: d.originalCompanyName,
    })),
  });
}
