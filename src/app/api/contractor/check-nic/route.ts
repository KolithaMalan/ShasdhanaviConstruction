import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { BlacklistedNICModel } from "@/models/BlacklistedNIC";
import { requireSession, jsonError } from "@/lib/api";

export const runtime = "nodejs";

/**
 * Lightweight NIC availability check used by the contractor "Add More
 * Employees" form for instant red/green feedback. Mirrors the server-side
 * validation that runs on submission.
 */
export async function GET(req: Request) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

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

  const blacklisted = await BlacklistedNICModel.findOne({ nicNumber: nicRaw })
    .select("reason name").lean();
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
    .select("companyName name status")
    .lean();

  if (existing) {
    return NextResponse.json({
      available: false,
      reason: "DUPLICATE",
      existingCompany: existing.companyName,
      message:
        `This NIC (${nicRaw}) is already registered in the system under ` +
        `${existing.companyName}. Duplicate registration is not allowed.`,
    });
  }

  return NextResponse.json({ available: true });
}
