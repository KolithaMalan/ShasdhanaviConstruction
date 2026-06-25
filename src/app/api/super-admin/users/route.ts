import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import { ROLE_VALUES } from "@/types";
import { requireRole, jsonError } from "@/lib/api";
import { generateTempPassword } from "@/lib/working-days";
import { logAction } from "@/lib/auditLogger";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();

  const filter: Record<string, unknown> = {};
  if (role && ROLE_VALUES.includes(role as never)) filter.role = role;
  if (status === "ACTIVE") filter.isActive = true;
  if (status === "BLOCKED") filter.isActive = false;
  if (q) {
    filter.$or = [
      { email: { $regex: q, $options: "i" } },
      { name: { $regex: q, $options: "i" } },
      { companyName: { $regex: q, $options: "i" } },
    ];
  }

  await connectDB();
  const docs = await UserModel.find(filter).sort({ createdAt: -1 }).limit(500).lean();
  return NextResponse.json({
    items: docs.map((d) => ({
      id: String(d._id),
      name: d.name,
      email: d.email,
      role: d.role,
      companyName: d.companyName ?? null,
      brNumber: d.brNumber ?? null,
      isActive: d.isActive,
      lastLoginAt: d.lastLoginAt,
      createdAt: (d as unknown as { createdAt: Date }).createdAt,
    })),
  });
}

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(120),
  role: z.enum(ROLE_VALUES),
  password: z.string().min(8).optional(),
  companyName: z.string().max(160).optional(),
  brNumber: z.string().max(40).optional(),
});

export async function POST(req: Request) {
  const guard = await requireRole(["SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload", issues: parsed.error.flatten() }, { status: 422 });
  }

  await connectDB();
  const existing = await UserModel.findOne({ email: parsed.data.email.toLowerCase() });
  if (existing) return jsonError("A user with that email already exists", 409);

  const generatedPassword = parsed.data.password ?? generateTempPassword();
  const hashed = await bcrypt.hash(generatedPassword, 10);

  const user = await UserModel.create({
    name: parsed.data.name,
    email: parsed.data.email.toLowerCase(),
    password: hashed,
    role: parsed.data.role,
    isActive: true,
    companyName: parsed.data.companyName ?? null,
    brNumber: parsed.data.brNumber ?? null,
    mustChangePassword: true,
  });

  void logAction({
    userId: guard.session.user.id,
    userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "",
    userRole: guard.session.user.role,
    action: "ACCOUNT_CREATE",
    entityType: "User",
    entityId: String(user._id),
    description: `Created ${parsed.data.role} account for ${parsed.data.email}`,
    request: req,
  });

  void sendEmail({
    to: user.email,
    subject: "Account Created — Shasdhanavi System",
    html: `<p>Hello ${user.name},</p>
           <p>An account has been created for you on the Shasdhanavi Construction Security System.</p>
           <p><strong>Email:</strong> ${user.email}<br/>
              <strong>Temporary password:</strong> ${generatedPassword}</p>
           <p>You will be required to change this password on first sign-in.</p>`,
  });

  return NextResponse.json({
    ok: true,
    id: String(user._id),
    temporaryPassword: generatedPassword,
  }, { status: 201 });
}
