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
    { $group: { _id: "$companyName", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const top = rows.slice(0, 10).map((r) => ({ company: r._id || "—", count: r.count }));
  const otherTotal = rows.slice(10).reduce((s, r) => s + (r.count as number), 0);
  if (otherTotal > 0) top.push({ company: "Others", count: otherTotal });

  return NextResponse.json({ items: top });
}
