import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import { ContractorRegistrationModel } from "@/models/ContractorRegistration";
import { UserModel } from "@/models/User";
import { generateTempPassword } from "@/lib/working-days";
import { notifyContractorApproval } from "@/lib/email";
import { bulkCreateEmployees } from "@/lib/employee";
import { bulkCreateVehicles } from "@/lib/vehicle";
import {
  bulkCreateElectricalEquipment,
  bulkCreateNonElectricalTools,
} from "@/lib/tools";
import { requireRole, jsonError, getBaseUrl } from "@/lib/api";
import { sendEmail } from "@/lib/email";
import { logAction } from "@/lib/auditLogger";
import { createNotification } from "@/lib/notificationService";

export const runtime = "nodejs";

interface Body {
  registrationId?: string;
}

export async function POST(req: Request) {
  const guard = await requireRole(["SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body.registrationId || !mongoose.Types.ObjectId.isValid(body.registrationId)) {
    return jsonError("registrationId required", 400);
  }

  await connectDB();
  const reg = await ContractorRegistrationModel.findById(body.registrationId);
  if (!reg) return jsonError("Registration not found", 404);
  if (reg.status !== "APPROVED") return jsonError("Registration must be approved first", 400);
  if (reg.contractorAccountCreated) return jsonError("Account already created", 409);

  const existing = await UserModel.findOne({ email: reg.email });
  if (existing) return jsonError("A user with this email already exists", 409);

  const tempPassword = generateTempPassword();
  const hashed = await bcrypt.hash(tempPassword, 10);

  const user = await UserModel.create({
    name: reg.companyName,
    email: reg.email,
    password: hashed,
    role: "CONTRACTOR",
    isActive: true,
    companyName: reg.companyName,
    brNumber: reg.brNumber,
    registrationId: reg._id,
    mustChangePassword: true,
  });

  reg.contractorAccountCreated = true;
  await reg.save();

  /* ── Phase 3 — bulk-create Employee records (PENDING_MEDICAL) ── */
  const employeeOutcome = await bulkCreateEmployees(
    String(user._id),
    reg.companyName,
    reg.labourList.map((l) => ({
      name: l.name,
      nicNumber: l.nicNumber,
      address: l.address,
      mobileNumber: l.mobileNumber,
      emergencyContact: l.emergencyContact,
      tradeType: l.tradeType,
      designation: l.designation,
      joinedDate: l.joinedDate,
    })),
  );

  /* ── Phase 4 — bulk-create Vehicle records with QR passes ── */
  const vehicleOutcome = await bulkCreateVehicles(
    String(user._id),
    reg.companyName,
    reg.vehicles.map((v) => ({
      vehicleNumber: v.vehicleNumber,
      vehicleType: v.vehicleType,
      vehicleColour: v.vehicleColour,
      vehiclePurpose: v.vehiclePurpose,
    })),
  );

  /* ── Phase 5 — bulk-create tools/equipment ── */
  const electricalOutcome = await bulkCreateElectricalEquipment(
    String(user._id),
    reg.companyName,
    reg.electricalEquipment.map((e) => ({
      toolName: e.toolName,
      category: e.category,
      quantity: e.quantity,
      serialNumber: e.serialNumber,
      powerDetails: e.powerDetails,
    })),
  );
  const nonElectricalOutcome = await bulkCreateNonElectricalTools(
    String(user._id),
    reg.companyName,
    reg.nonElectricalTools.map((t) => ({
      toolName: t.toolName,
      category: t.category,
      quantity: t.quantity,
      unit: t.unit,
    })),
  );

  const baseUrl = getBaseUrl(req);
  void notifyContractorApproval({
    to: reg.email,
    companyName: reg.companyName,
    email: reg.email,
    temporaryPassword: tempPassword,
    loginUrl: `${baseUrl}/login`,
  });

  /* Additional advisory email — only when there's something to call out */
  if (electricalOutcome.created > 0 || nonElectricalOutcome.created > 0) {
    void sendEmail({
      to: reg.email,
      subject: "Tools & Equipment Registered — Shasdhanavi System",
      html: `<p>Hello <strong>${reg.companyName}</strong>,</p>
             <p>Your account is now set up. The following items are registered:</p>
             <ul>
               ${electricalOutcome.created > 0
                 ? `<li><strong>${electricalOutcome.created}</strong> electrical equipment item(s) — <em>pending HSEQ electrical inspection</em> before they can enter the site.</li>` : ""}
               ${nonElectricalOutcome.created > 0
                 ? `<li><strong>${nonElectricalOutcome.created}</strong> non-electrical tool record(s) — now in your inventory and available via gate-pass movements.</li>` : ""}
             </ul>
             <p>You can view all of this under <em>My Equipment</em> in your contractor console.</p>`,
    });
  }

  void logAction({
    userId: guard.session.user.id,
    userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "",
    userRole: guard.session.user.role,
    action: "ACCOUNT_CREATE",
    entityType: "User",
    entityId: String(user._id),
    description: `Created contractor account for ${reg.companyName} (${reg.email})`,
    request: req,
  });

  void createNotification({
    userId: user._id,
    type: "ACCOUNT_CREATED",
    title: "Your account is ready",
    message: `Welcome ${reg.companyName}. Your contractor console is now live — sign in with the temporary password sent to your email.`,
    link: "/contractor",
  });

  return NextResponse.json({
    ok: true,
    userId: String(user._id),
    temporaryPassword: tempPassword,
    employees: employeeOutcome,
    vehicles: vehicleOutcome,
    electricalEquipment: electricalOutcome,
    nonElectricalTools: nonElectricalOutcome,
  });
}
