import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import { requireSession } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  await connectDB();
  const user = await UserModel.findById(guard.session.user.id).lean();
  if (!user) return NextResponse.json({ message: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    companyName: user.companyName ?? null,
    brNumber: user.brNumber ?? null,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: (user as unknown as { createdAt: Date }).createdAt,
    mustChangePassword: user.mustChangePassword ?? false,
  });
}
