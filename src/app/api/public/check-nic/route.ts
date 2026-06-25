import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { BlacklistedNICModel } from "@/models/BlacklistedNIC";
import { jsonError } from "@/lib/api";

export const runtime = "nodejs";

/**
 * PUBLIC variant of /api/contractor/check-nic. Used during the
 * pre-registration form on /contractor-registration where no session
 * exists yet. Only returns whether the NIC is available — no PII.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const nicRaw = searchParams.get("nic")?.trim().toUpperCase();
  if (!nicRaw) return jsonError("nic required", 400);
  if (!/^(\d{9}[VX]|\d{12})$/.test(nicRaw)) {
    return NextResponse.json({
      available: false,
      reason: "INVALID_FORMAT",
      message: "NIC must be 9 digits + V/X, or 12 digits.",
    });
  }

  await connectDB();

  const blacklisted = await BlacklistedNICModel.exists({ nicNumber: nicRaw });
  if (blacklisted) {
    return NextResponse.json({
      available: false,
      reason: "BLACKLISTED",
      message: "This NIC is blacklisted and cannot be registered.",
    });
  }

  const existing = await EmployeeModel.findOne({
    nicNumber: nicRaw,
    status: { $nin: ["MEDICAL_REJECTED", "BLOCKED"] },
  })
    .select("companyName")
    .lean();
  if (existing) {
    return NextResponse.json({
      available: false,
      reason: "DUPLICATE",
      existingCompany: existing.companyName,
      message:
        `This NIC (${nicRaw}) is already registered under ${existing.companyName}.`,
    });
  }

  return NextResponse.json({ available: true });
}
