import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { VehicleModel } from "@/models/Vehicle";
import { VisitorPassModel } from "@/models/VisitorPass";
import { VisitorModel } from "@/models/Visitor";
import { PermanentEmployeeModel } from "@/models/PermanentEmployee";
import { WorkerModel } from "@/models/Worker";
import { WorkerGateVisitModel } from "@/models/WorkerGateVisit";
import { BlacklistedNICModel } from "@/models/BlacklistedNIC";
import mongoose from "mongoose";

import { parseQr } from "@/lib/qr";
import { serializeEmployee } from "@/lib/employee";
import { serializeVehicle } from "@/lib/vehicle";
import { loadContractorMaterials } from "@/lib/materialsPass";
import { checkExpiredIdCards } from "@/lib/idCardChecker";
import { requireRole, jsonError } from "@/lib/api";
import { requireFeature } from "@/lib/featureService";

export const runtime = "nodejs";

interface Body { qrData?: string }

export async function POST(req: Request) {
  const guard = await requireRole(["SECURITY_OFFICER", "HSEQ_OFFICER", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const blocked = await requireFeature(guard.session.user.role, "action:gate.scan");
  if (blocked) return blocked;

  const body = (await req.json().catch(() => ({}))) as Body;
  const raw = (body.qrData ?? "").trim();
  if (!raw) return jsonError("Missing qrData", 400);

  await connectDB();
  await checkExpiredIdCards();

  /* Allow either a JSON QR payload OR a raw employee-id / NIC for manual entry */
  const parsed = parseQr(raw);

  /* ── Manual-entry routing ─────────────────────────────
     If the input isn't a JSON QR payload, try to detect its format:
       SHA-YYYY-XXXXX  → Employee ID
       NIC (9+VX or 12 digits)
       VP-XXX         → Visitor pass
       VEH-YYYY-XXXXX → Vehicle QR
     Falls through to "INVALID_QR" if none match. */
  const upper = raw.toUpperCase();
  const looksLikeEmpId = /^SHA-\d{4}-[A-Z0-9]{5,}$/i.test(upper);
  const looksLikeNic = /^(\d{9}[VX]|\d{12})$/i.test(upper);
  const looksLikeVisitorPass = !parsed && /^VP-\d{2,}$/i.test(upper);
  const looksLikeVehicleId = !parsed && /^VEH-\d{4}-[A-Z0-9]{5,}$/i.test(upper);
  const looksLikePermanentId = !parsed && /^PERM-\d{4}-[A-Z0-9]{5,}$/i.test(upper);
  const looksLikeWorkerId = !parsed && /^WRK-\d{4}-[A-Z0-9]{5,}$/i.test(upper);

  /* ── EMPLOYEE ──────────────────────────────────────── */
  if (parsed?.type === "EMPLOYEE" || looksLikeEmpId || looksLikeNic) {
    const isQr = parsed?.type === "EMPLOYEE";
    const empId = isQr ? parsed.eid : upper;
    const nic = isQr ? parsed.nic : upper;

    /* Blacklist guard only when the input is actually a NIC */
    if (isQr || looksLikeNic) {
      const blacklisted = await BlacklistedNICModel.findOne({ nicNumber: nic }).lean();
      if (blacklisted) {
        return NextResponse.json({
          kind: "ERROR",
          code: "BLACKLISTED",
          message: "NIC is blacklisted. Entry denied.",
        });
      }
    }

    const employee = await EmployeeModel.findOne(
      isQr
        ? { $or: [{ employeeId: empId }, { nicNumber: nic }] }
        : looksLikeEmpId
          ? { employeeId: empId }
          : { nicNumber: nic },
    ).lean();

    if (!employee) {
      return NextResponse.json({
        kind: "ERROR",
        code: "NOT_FOUND",
        message: "Employee not found. Verify the ID card or contact Admin.",
      });
    }

    if (employee.status === "BLOCKED") {
      return NextResponse.json({
        kind: "ERROR",
        code: "BLOCKED",
        message: "Employee status: BLOCKED. Entry denied.",
        employee: serializeEmployee(employee),
      });
    }
    if (employee.status === "MEDICAL_REJECTED") {
      return NextResponse.json({
        kind: "ERROR",
        code: "MEDICAL_REJECTED",
        message: "Medical rejection on record. Entry denied.",
        employee: serializeEmployee(employee),
      });
    }
    if (employee.status === "DEACTIVATED") {
      const expiredOn = employee.idCardExpiresAt
        ? new Date(employee.idCardExpiresAt).toLocaleDateString("en-GB")
        : null;
      return NextResponse.json({
        kind: "ERROR",
        code: "ID_EXPIRED",
        message: expiredOn
          ? `ID Card EXPIRED on ${expiredOn}. Direct to Admin Office for reactivation.`
          : "ID Card EXPIRED. Direct to Admin Office for reactivation.",
        employee: serializeEmployee(employee),
      });
    }
    if (employee.status !== "ACTIVE") {
      return NextResponse.json({
        kind: "ERROR",
        code: "NOT_ACTIVE",
        message: `Employee is not active (${employee.status}). Cannot enter.`,
        employee: serializeEmployee(employee),
      });
    }

    return NextResponse.json({
      kind: "EMPLOYEE",
      employee: serializeEmployee(employee),
    });
  }

  /* ── VISITOR PASS ───────────────────────────────────── */
  if (parsed?.type === "VISITOR_PASS" || looksLikeVisitorPass) {
    const passId = parsed?.type === "VISITOR_PASS" ? parsed.passId.toUpperCase() : upper;
    const pass = await VisitorPassModel.findOne({ passId }).lean();
    if (!pass) {
      return NextResponse.json({
        kind: "ERROR",
        code: "PASS_NOT_FOUND",
        message: "Visitor pass not registered. Contact Admin.",
      });
    }
    let visitor = null;
    if (pass.currentStatus === "IN_USE" && pass.currentVisitorId) {
      const v = await VisitorModel.findById(pass.currentVisitorId).lean();
      if (v) {
        visitor = {
          id: String(v._id),
          name: v.name,
          nicNumber: v.nicNumber,
          company: v.company,
          purpose: v.purpose,
          contactPerson: v.contactPerson,
          enteredAt: v.enteredAt,
        };
      }
    }
    return NextResponse.json({
      kind: "VISITOR_PASS",
      pass: {
        id: String(pass._id),
        passId: pass.passId,
        currentStatus: pass.currentStatus,
      },
      visitor,
    });
  }

  /* ── VEHICLE ───────────────────────────────────────── */
  if (parsed?.type === "VEHICLE" || looksLikeVehicleId) {
    const vid = parsed?.type === "VEHICLE" ? parsed.vid : upper;
    const vehicle = await VehicleModel.findOne({ vehicleQrId: vid }).lean();
    if (!vehicle) {
      return NextResponse.json({
        kind: "ERROR",
        code: "VEHICLE_NOT_FOUND",
        message: "Vehicle not registered. Contact Admin.",
      });
    }
    if (vehicle.status === "BLOCKED") {
      return NextResponse.json({
        kind: "ERROR",
        code: "VEHICLE_BLOCKED",
        message: "Vehicle is BLOCKED. Entry denied.",
        vehicle: serializeVehicle(vehicle),
      });
    }
    return NextResponse.json({
      kind: "VEHICLE",
      vehicle: serializeVehicle(vehicle),
    });
  }

  /* ── PERMANENT EMPLOYEE ─────────────────────────────── */
  if (parsed?.type === "PERMANENT_EMPLOYEE" || looksLikePermanentId) {
    const pid = parsed?.type === "PERMANENT_EMPLOYEE" ? parsed.pid : upper;
    const perm = await PermanentEmployeeModel.findOne({ permanentId: pid }).lean();
    if (!perm) {
      return NextResponse.json({
        kind: "ERROR",
        code: "PERM_NOT_FOUND",
        message: "Permanent pass not registered. Contact Admin — HSEQ.",
      });
    }
    return NextResponse.json({
      kind: "PERMANENT_EMPLOYEE",
      permanent: {
        id: String(perm._id),
        name: perm.name,
        designation: perm.designation,
        department: perm.department,
        nicNumber: perm.nicNumber,
        permanentId: perm.permanentId,
        photoUrl: perm.photoUrl ?? "",
        currentStatus: perm.currentStatus ?? "OUT",
      },
    });
  }

  /* ── WORKER (Yugadhanavi / Sobadhanavi) ─────────────── */
  if (parsed?.type === "WORKER" || looksLikeWorkerId) {
    const wid = parsed?.type === "WORKER" ? parsed.wid : upper;
    const worker = await WorkerModel.findOne({ workerId: wid }).lean();
    if (!worker) {
      return NextResponse.json({
        kind: "ERROR",
        code: "WORKER_NOT_FOUND",
        message: "Worker pass not registered. Contact HSEQ.",
      });
    }

    /* Any OPEN item record (morning items) for this worker, shown so the
       officer can verify items on OUT. */
    const openVisit = await WorkerGateVisitModel.findOne({
      workerId: worker._id,
      status: "OPEN",
    }).lean();

    return NextResponse.json({
      kind: "WORKER",
      worker: {
        id: String(worker._id),
        name: worker.name,
        company: worker.company,
        designation: worker.designation,
        nicNumber: worker.nicNumber,
        workerId: worker.workerId,
        photoUrl: worker.photoUrl ?? "",
        currentStatus: worker.currentStatus ?? "OUT",
      },
      openVisit: openVisit
        ? {
            id: String(openVisit._id),
            items: (openVisit.items ?? []).map((i) => ({
              name: i.name ?? "",
              addedAt: i.addedAt ? new Date(i.addedAt).toISOString() : null,
            })),
            checkInAt: openVisit.checkInAt ? new Date(openVisit.checkInAt).toISOString() : null,
          }
        : null,
    });
  }

  /* ── MATERIALS PASS ─────────────────────────────────── */
  if (parsed?.type === "MATERIALS_PASS") {
    if (!mongoose.Types.ObjectId.isValid(parsed.cid)) {
      return NextResponse.json({
        kind: "ERROR",
        code: "MATERIALS_INVALID",
        message: "Materials pass is not valid. Ask the contractor to re-download it.",
      });
    }
    const { companyName, items } = await loadContractorMaterials(parsed.cid);
    return NextResponse.json({
      kind: "MATERIALS",
      contractor: { id: parsed.cid, companyName },
      items,
    });
  }

  return NextResponse.json({
    kind: "ERROR",
    code: "INVALID_QR",
    message:
      "Unrecognised input. Use a scanned QR, an Employee ID (SHA-YYYY-XXXXX), an NIC, a visitor pass (VP-001), a vehicle ID (VEH-YYYY-XXXXX), a permanent pass (PERM-YYYY-XXXXX), or a worker pass (WRK-YYYY-XXXXX).",
  });
}
