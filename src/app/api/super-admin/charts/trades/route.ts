import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireRole(["SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  await connectDB();
  const rows = await EmployeeModel.aggregate([
    { $group: { _id: "$tradeType", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  return NextResponse.json({
    items: rows.map((r) => ({ trade: r._id || "—", count: r.count })),
  });
}
