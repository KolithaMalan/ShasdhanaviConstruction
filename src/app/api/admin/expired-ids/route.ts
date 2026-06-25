import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { serializeEmployee } from "@/lib/employee";
import { checkExpiredIdCards } from "@/lib/idCardChecker";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireRole(["SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  await connectDB();
  await checkExpiredIdCards();

  const docs = await EmployeeModel.find({ status: "DEACTIVATED" })
    .sort({ idCardExpiresAt: -1 })
    .limit(500)
    .lean();

  return NextResponse.json({ items: docs.map((d) => serializeEmployee(d)) });
}
