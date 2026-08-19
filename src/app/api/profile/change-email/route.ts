import { NextResponse } from "next/server";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import { requireSession, jsonError } from "@/lib/api";
import { logAction } from "@/lib/auditLogger";

export const runtime = "nodejs";

/** Roles that are allowed to change their own email. */
const ALLOWED_ROLES = [
  "ADMIN_HSEQ",
  "MEDICAL_OFFICER",
  "HSEQ_OFFICER",
  "SECURITY_OFFICER",
  "INTERNAL_SECURITY",
] as const;

const bodySchema = z.object({
  newEmail: z
    .string()
    .email("Invalid email address")
    .transform((v) => v.toLowerCase().trim()),
});

export async function PATCH(req: Request) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  /* Only the five specified roles may change their email */
  const userRole = guard.session.user.role;
  if (!ALLOWED_ROLES.includes(userRole as (typeof ALLOWED_ROLES)[number])) {
    return jsonError("Your role does not allow email changes", 403);
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0]?.message ?? "Invalid payload" },
      { status: 422 },
    );
  }

  const { newEmail } = parsed.data;

  await connectDB();

  const user = await UserModel.findById(guard.session.user.id);
  if (!user) return jsonError("User not found", 404);

  /* No-op if email hasn't changed */
  if (user.email === newEmail) {
    return jsonError("New email is the same as the current one", 422);
  }

  /* Check uniqueness */
  const existing = await UserModel.findOne({ email: newEmail }).lean();
  if (existing) {
    return jsonError("This email is already in use by another account", 409);
  }

  const oldEmail = user.email;
  user.email = newEmail;
  await user.save();

  void logAction({
    userId: user._id,
    userName: user.name,
    userEmail: newEmail,
    userRole: user.role,
    action: "UPDATE",
    entityType: "User",
    entityId: String(user._id),
    description: `Email changed from ${oldEmail} to ${newEmail}`,
    metadata: { oldEmail, newEmail },
    request: req,
  });

  return NextResponse.json({ ok: true, email: newEmail });
}
