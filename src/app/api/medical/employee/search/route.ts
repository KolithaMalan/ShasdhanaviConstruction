import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { BlacklistedNICModel } from "@/models/BlacklistedNIC";
import { serializeEmployee } from "@/lib/employee";
import { requireRole, jsonError } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["MEDICAL_OFFICER", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const nic = searchParams.get("nic")?.trim().toUpperCase();
  const name = searchParams.get("name")?.trim();

  if (!nic && !name) return jsonError("Provide nic or name");

  await connectDB();

  if (nic) {
    const blacklisted = await BlacklistedNICModel.findOne({ nicNumber: nic }).lean();
    if (blacklisted) {
      return NextResponse.json({
        match: null,
        blacklisted: {
          nicNumber: blacklisted.nicNumber,
          name: blacklisted.name,
          reason: blacklisted.reason,
          blacklistedAt: blacklisted.blacklistedAt,
        },
      });
    }
  }

  const filter: Record<string, unknown> = { status: "PENDING_MEDICAL" };
  if (nic) filter.nicNumber = nic;
  else if (name) filter.name = { $regex: name, $options: "i" };

  const doc = await EmployeeModel.findOne(filter).lean();
  if (!doc) return NextResponse.json({ match: null });

  return NextResponse.json({ match: serializeEmployee(doc) });
}
