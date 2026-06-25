import { NextResponse } from "next/server";
import { z } from "zod";

import { getSettings, patchSettings } from "@/lib/settingsService";
import { requireRole, jsonError } from "@/lib/api";
import { logAction } from "@/lib/auditLogger";

export const runtime = "nodejs";

const patchSchema = z.object({
  companyName: z.string().max(160).optional(),
  companyLogo: z.string().max(500).optional(),
  siteName: z.string().max(160).optional(),
  idCardValidityMonths: z.coerce.number().int().min(1).max(60).optional(),
  maxPhotoSizeKb: z.coerce.number().int().min(50).max(5000).optional(),
  defaultGateLocation: z.string().max(80).optional(),
  emailNotifications: z.boolean().optional(),
  smtpHost: z.string().max(160).optional(),
  smtpPort: z.coerce.number().int().min(1).max(65535).optional(),
  smtpFrom: z.string().max(160).optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().max(400).optional(),
});

export async function GET() {
  const guard = await requireRole(["SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  const doc = await getSettings();
  return NextResponse.json({
    companyName: doc.companyName,
    companyLogo: doc.companyLogo,
    siteName: doc.siteName,
    idCardValidityMonths: doc.idCardValidityMonths,
    maxPhotoSizeKb: doc.maxPhotoSizeKb,
    defaultGateLocation: doc.defaultGateLocation,
    emailNotifications: doc.emailNotifications,
    smtpHost: doc.smtpHost,
    smtpPort: doc.smtpPort,
    smtpFrom: doc.smtpFrom,
    maintenanceMode: doc.maintenanceMode,
    maintenanceMessage: doc.maintenanceMessage,
  });
}

export async function PATCH(req: Request) {
  const guard = await requireRole(["SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return jsonError("Invalid payload", 422);

  const doc = await patchSettings(parsed.data);

  void logAction({
    userId: guard.session.user.id,
    userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "",
    userRole: guard.session.user.role,
    action: "SETTING_CHANGE",
    entityType: "SystemSettings",
    entityId: String(doc._id),
    description: "Updated system settings",
    metadata: parsed.data,
    request: req,
  });

  return NextResponse.json({ ok: true });
}
