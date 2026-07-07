import { NextResponse } from "next/server";
import { z } from "zod";

import { sendEmail } from "@/lib/email";
import { requireRole, jsonError } from "@/lib/api";
import { logAction } from "@/lib/auditLogger";

export const runtime = "nodejs";

const bodySchema = z.object({
  to: z.string().trim().email("Enter a valid email address").optional(),
});

export async function POST(req: Request) {
  const guard = await requireRole(["SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid payload", 422);
  }

  const to = parsed.data.to ?? guard.session.user.email ?? "";
  if (!to) return jsonError("No recipient email available", 400);

  const sentAt = new Date().toLocaleString("en-GB");
  const result = await sendEmail({
    to,
    subject: "Sahasdhanavi — SMTP test email",
    html: `
      <p>This is a test email from the Sahasdhanavi Security &amp; HSEQ system.</p>
      <p>If you are reading this, your SMTP configuration is working correctly.</p>
      <p style="color:#888;font-size:12px">Triggered by ${guard.session.user.email ?? "Super Admin"} at ${sentAt}.</p>
    `,
  });

  void logAction({
    userId: guard.session.user.id,
    userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "",
    userRole: guard.session.user.role,
    action: "SETTING_CHANGE",
    entityType: "SystemSettings",
    description: `Sent SMTP test email to ${to} — ${result.delivered ? "delivered" : "failed"}`,
    metadata: { to, delivered: result.delivered, reason: result.reason ?? null },
    request: req,
  });

  if (!result.delivered) {
    return NextResponse.json(
      { ok: false, message: result.reason ?? "Email could not be sent" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, to });
}
