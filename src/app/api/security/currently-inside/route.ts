import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { VehicleModel } from "@/models/Vehicle";
import { VisitorModel } from "@/models/Visitor";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["SECURITY_OFFICER", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const type = (searchParams.get("type") ?? "EMPLOYEE").toUpperCase();

  await connectDB();

  if (type === "VEHICLE") {
    const docs = await VehicleModel.find({ currentStatus: "IN", status: "ACTIVE" })
      .sort({ lastScanAt: -1 })
      .limit(500)
      .lean();
    return NextResponse.json({
      items: docs.map((d) => ({
        id: String(d._id),
        vehicleNumber: d.vehicleNumber,
        vehicleType: d.vehicleType,
        companyName: d.companyName,
        lastScanAt: d.lastScanAt,
      })),
    });
  }

  if (type === "VISITOR") {
    const docs = await VisitorModel.find({ currentStatus: "IN" })
      .sort({ enteredAt: -1 })
      .limit(500)
      .lean();
    return NextResponse.json({
      items: docs.map((d) => ({
        id: String(d._id),
        passId: d.visitorPassId,
        name: d.name,
        nicNumber: d.nicNumber,
        company: d.company,
        purpose: d.purpose,
        contactPerson: d.contactPerson,
        enteredAt: d.enteredAt,
      })),
    });
  }

  /* EMPLOYEE (default) */
  const docs = await EmployeeModel.find({ currentStatus: "IN", status: "ACTIVE" })
    .sort({ lastScanAt: -1 })
    .limit(500)
    .lean();
  return NextResponse.json({
    items: docs.map((d) => ({
      id: String(d._id),
      name: d.name,
      employeeId: d.employeeId,
      nicNumber: d.nicNumber,
      companyName: d.companyName,
      tradeType: d.tradeType,
      lastScanAt: d.lastScanAt,
    })),
  });
}
