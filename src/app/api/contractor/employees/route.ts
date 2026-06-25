import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import { EmployeeModel } from "@/models/Employee";
import { serializeEmployee } from "@/lib/employee";
import { checkExpiredIdCards } from "@/lib/idCardChecker";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireRole(["CONTRACTOR"]);
  if (!guard.ok) return guard.response;

  await connectDB();
  await checkExpiredIdCards();

  const user = await UserModel.findById(guard.session.user.id).lean();
  if (!user) return NextResponse.json({ items: [] });

  const docs = await EmployeeModel.find({ contractorId: user._id })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({
    companyName: user.companyName,
    items: docs.map((d) => serializeEmployee(d)),
  });
}
