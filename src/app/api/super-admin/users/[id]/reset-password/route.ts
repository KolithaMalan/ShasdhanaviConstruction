import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import { generateTempPassword } from "@/lib/working-days";
import { requireRole, jsonError } from "@/lib/api";
import { logAction } from "@/lib/auditLogger";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(["SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  await connectDB();
  const user = await UserModel.findById(id);
  if (!user) return jsonError("Not found", 404);

  const newPassword = generateTempPassword();
  user.password = await bcrypt.hash(newPassword, 10);
  user.mustChangePassword = true;
  await user.save();

  void logAction({
    userId: guard.session.user.id,
    userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "",
    userRole: guard.session.user.role,
    action: "PASSWORD_CHANGE",
    entityType: "User",
    entityId: String(user._id),
    description: `Reset password for ${user.email}`,
    request: req,
  });

  void sendEmail({
    to: user.email,
    subject: "Password Reset — Sahasdhanavi System",
    html: `<p>Hello ${user.name},</p>
           <p>Your password has been reset by an administrator. Your new temporary password is:</p>
           <p><strong>${newPassword}</strong></p>
           <p>You will be asked to change this on your next sign-in.</p>`,
  });

  return NextResponse.json({ ok: true, temporaryPassword: newPassword });
}
