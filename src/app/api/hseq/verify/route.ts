import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { PermanentEmployeeModel } from "@/models/PermanentEmployee";
import { WorkerModel } from "@/models/Worker";
import { WorkerGateVisitModel } from "@/models/WorkerGateVisit";
import { BlacklistedNICModel } from "@/models/BlacklistedNIC";
import { parseQr } from "@/lib/qr";
import { serializeEmployee } from "@/lib/employee";
import { requireRole, jsonError } from "@/lib/api";
import { requireFeature } from "@/lib/featureService";
import { logAction } from "@/lib/auditLogger";

export const runtime = "nodejs";

/**
 * Read-only identity check for a spot inspection on site.
 *
 * Deliberately NOT the gate endpoint: it never writes a MovementLog and never
 * changes `currentStatus`. The HSEQ / Admin officer scans a person's QR while
 * walking the site and gets back who they are, so scanning here must not look
 * like a gate entry in the attendance record.
 */
interface Body { qrData?: string }

export async function POST(req: Request) {
  const guard = await requireRole(["HSEQ_OFFICER", "ADMIN_HSEQ", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const blocked = await requireFeature(guard.session.user.role, "action:id.verify");
  if (blocked) return blocked;

  const body = (await req.json().catch(() => ({}))) as Body;
  const raw = (body.qrData ?? "").trim();
  if (!raw) return jsonError("Missing qrData", 400);

  await connectDB();

  const parsed = parseQr(raw);
  const upper = raw.toUpperCase();
  const looksLikeEmpId = /^SHA-\d{4}-[A-Z0-9]{5,}$/i.test(upper);
  const looksLikeNic = /^(\d{9}[VX]|\d{12})$/i.test(upper);
  const looksLikePermanentId = !parsed && /^PERM-\d{4}-[A-Z0-9]{5,}$/i.test(upper);
  const looksLikeWorkerId = !parsed && /^WRK-\d{4}-[A-Z0-9]{5,}$/i.test(upper);

  /* Spot checks are logged so there's a trail of who was stopped and when. */
  const officer = guard.session.user;
  function audit(subject: string) {
    void logAction({
      userId: officer.id,
      userName: officer.name ?? "",
      userEmail: officer.email ?? "",
      userRole: officer.role,
      action: "ID_VERIFY",
      entityType: "IdVerification",
      entityId: subject,
      description: `On-site ID verification · ${subject}`,
      request: req,
    });
  }

  /* ── Contractor employee — the full card the officer needs ── */
  if (parsed?.type === "EMPLOYEE" || looksLikeEmpId || looksLikeNic) {
    const isQr = parsed?.type === "EMPLOYEE";
    const empId = isQr ? parsed.eid : upper;
    const nic = isQr ? parsed.nic : upper;

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
        message: "No record found for this ID. Treat as unverified and escalate.",
      });
    }

    const e = serializeEmployee(employee);
    const blacklisted = await BlacklistedNICModel.findOne({ nicNumber: e.nicNumber })
      .select("_id")
      .lean();

    audit(`${e.name} (${e.employeeId ?? e.nicNumber})`);

    return NextResponse.json({
      kind: "EMPLOYEE",
      person: {
        name: e.name,
        photoUrl: e.photoUrl,
        nicNumber: e.nicNumber,
        identifier: e.employeeId ?? "—",
        contractor: e.companyName,
        trade: e.tradeType,
        designation: e.designation || "—",
        bloodType: e.bloodType || "Unknown",
        /* "First deployed" = the day the Medical Officer cleared them, which is
           when they first became eligible to be on site. */
        firstDeployedAt: e.medicalScreenedAt,
        joinedDate: e.joinedDate,
        status: e.status,
        medicalStatus: e.medicalStatus,
        idCardExpiresAt: e.idCardExpiresAt,
        currentStatus: e.currentStatus,
        blacklisted: !!blacklisted,
      },
    });
  }

  /* ── Permanent employee ── */
  if (parsed?.type === "PERMANENT_EMPLOYEE" || looksLikePermanentId) {
    const pid = parsed?.type === "PERMANENT_EMPLOYEE" ? parsed.pid : upper;
    const doc = await PermanentEmployeeModel.findOne({ permanentId: pid }).lean();
    if (!doc) {
      return NextResponse.json({
        kind: "ERROR",
        code: "NOT_FOUND",
        message: "Permanent employee pass not registered.",
      });
    }

    audit(`${doc.name} (${doc.permanentId})`);

    return NextResponse.json({
      kind: "PERMANENT",
      person: {
        name: doc.name,
        photoUrl: doc.photoUrl ?? "",
        nicNumber: doc.nicNumber,
        identifier: doc.permanentId ?? "—",
        contractor: "Sahasdhanavi (Permanent Staff)",
        trade: doc.department || "—",
        designation: doc.designation || "—",
        bloodType: "—",
        firstDeployedAt: null,
        joinedDate: null,
        status: "ACTIVE",
        medicalStatus: null,
        idCardExpiresAt: null,
        currentStatus: doc.currentStatus ?? "OUT",
        blacklisted: false,
      },
    });
  }

  /* ── Yugadhanavi / Sobadhanavi worker ── */
  if (parsed?.type === "WORKER" || looksLikeWorkerId) {
    const wid = parsed?.type === "WORKER" ? parsed.wid : upper;
    const doc = await WorkerModel.findOne({ workerId: wid }).lean();
    if (!doc) {
      return NextResponse.json({
        kind: "ERROR",
        code: "NOT_FOUND",
        message: "Worker pass not registered.",
      });
    }

    /* Item tracking is workers-only, so this block has no equivalent for the
       other two kinds. Shows what they carried in and have not signed out. */
    const openVisit = await WorkerGateVisitModel.findOne({
      workerId: doc._id,
      status: "OPEN",
    }).lean();

    audit(`${doc.name} (${doc.workerId})`);

    return NextResponse.json({
      kind: "WORKER",
      visit: openVisit
        ? {
            checkInAt: openVisit.checkInAt ? new Date(openVisit.checkInAt).toISOString() : null,
            gateLocation: openVisit.gateLocation ?? "",
            items: (openVisit.items ?? []).map((i) => ({
              name: i.name ?? "",
              addedAt: i.addedAt ? new Date(i.addedAt).toISOString() : null,
            })),
          }
        : null,
      person: {
        name: doc.name,
        photoUrl: doc.photoUrl ?? "",
        nicNumber: doc.nicNumber,
        identifier: doc.workerId ?? "—",
        contractor: doc.company,
        trade: doc.department || "—",
        designation: doc.designation || "—",
        bloodType: "—",
        firstDeployedAt: null,
        joinedDate: null,
        status: "ACTIVE",
        medicalStatus: null,
        idCardExpiresAt: null,
        currentStatus: doc.currentStatus ?? "OUT",
        blacklisted: false,
      },
    });
  }

  return NextResponse.json({
    kind: "ERROR",
    code: "INVALID_QR",
    message: "Unrecognised code. Scan a Sahasdhanavi ID card QR, or type the ID / NIC.",
  });
}
