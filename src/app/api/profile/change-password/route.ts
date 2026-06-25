import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import { requireSession, jsonError } from "@/lib/api";
import { logAction } from "@/lib/auditLogger";

export const runtime = "nodejs";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must include an uppercase letter")
  .regex(/[a-z]/, "Must include a lowercase letter")
  .regex(/[0-9]/, "Must include a digit")
  .regex(/[^A-Za-z0-9]/, "Must include a symbol");

const bodySchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function PATCH(req: Request) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0]?.message ?? "Invalid payload" },
      { status: 422 },
    );
  }

  await connectDB();
  const user = await UserModel.findById(guard.session.user.id).select("+password");
  if (!user) return jsonError("User not found", 404);

  const currentOk = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!currentOk) return jsonError("Current password is incorrect", 401);

  user.password = await bcrypt.hash(parsed.data.newPassword, 10);
  user.mustChangePassword = false;
  await user.save();

  void logAction({
    userId: user._id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: "PASSWORD_CHANGE",
    entityType: "User",
    entityId: String(user._id),
    description: `Password updated by ${user.email}`,
    request: req,
  });

  return NextResponse.json({ ok: true });
}
