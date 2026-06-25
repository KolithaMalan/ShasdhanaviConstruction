import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { serializeEmployee } from "@/lib/employee";
import { checkExpiredIdCards } from "@/lib/idCardChecker";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["HSEQ_OFFICER", "SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  await connectDB();
  await checkExpiredIdCards();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // ACTIVE | DEACTIVATED | ALL
  const q = searchParams.get("q")?.trim();
  const contractor = searchParams.get("contractor")?.trim();

  const filter: Record<string, unknown> = {
    status: { $in: ["ACTIVE", "DEACTIVATED"] },
  };
  if (status === "ACTIVE" || status === "DEACTIVATED") filter.status = status;
  if (contractor) filter.companyName = contractor;
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { nicNumber: { $regex: q.toUpperCase(), $options: "i" } },
      { employeeId: { $regex: q.toUpperCase(), $options: "i" } },
    ];
  }

  const docs = await EmployeeModel.find(filter).sort({ idCardIssuedAt: -1 }).limit(500).lean();
  return NextResponse.json({ items: docs.map((d) => serializeEmployee(d)) });
}
