import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireRole(["MEDICAL_OFFICER", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  await connectDB();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [pending, passedToday, failedToday, screenedTotal] = await Promise.all([
    EmployeeModel.countDocuments({ status: "PENDING_MEDICAL" }),
    EmployeeModel.countDocuments({
      medicalStatus: "PASSED",
      medicalScreenedAt: { $gte: startOfDay },
    }),
    EmployeeModel.countDocuments({
      medicalStatus: "FAILED",
      medicalScreenedAt: { $gte: startOfDay },
    }),
    EmployeeModel.countDocuments({
      medicalStatus: { $in: ["PASSED", "FAILED"] },
    }),
  ]);

  return NextResponse.json({ pending, passedToday, failedToday, screenedTotal });
}
