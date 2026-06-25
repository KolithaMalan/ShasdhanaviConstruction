import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { serializeEmployee } from "@/lib/employee";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["HSEQ_OFFICER", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const contractor = searchParams.get("contractor")?.trim();

  await connectDB();
  const filter: Record<string, unknown> = { status: "MEDICAL_PASSED" };
  if (contractor) filter.companyName = contractor;
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { nicNumber: { $regex: q.toUpperCase(), $options: "i" } },
    ];
  }

  const docs = await EmployeeModel.find(filter).sort({ medicalScreenedAt: 1 }).lean();
  return NextResponse.json({ items: docs.map((d) => serializeEmployee(d)) });
}
