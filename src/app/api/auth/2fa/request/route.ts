import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import {
  issueTwoFactorCode,
  TWO_FA_CODE_LIFETIME_SECONDS,
} from "@/lib/twofactor";
import { notifyTwoFactorCode } from "@/lib/email";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();

  await connectDB();
  const user = await UserModel.findOne({ email, isActive: true })
    .select("+password")
    .lean();

  if (!user) {
    // Don't leak whether the email exists.
    return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
  }

  const ok = await bcrypt.compare(parsed.data.password, user.password);
  if (!ok) {
    return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
  }

  // Only contractors face the first-time gate, and only until they've verified once.
  if (user.role !== "CONTRACTOR" || user.verifiedAt) {
    return NextResponse.json({ requires2fa: false });
  }

  const issued = await issueTwoFactorCode(email);
  if (!issued.ok) {
    if (issued.reason === "LOCKED_OUT") {
      return NextResponse.json(
        {
          message: `Too many failed attempts. Please wait ${Math.ceil(issued.retryAfterSeconds / 60)} minutes and try again.`,
          retryAfterSeconds: issued.retryAfterSeconds,
          lockedOut: true,
        },
        { status: 429 },
      );
    }
    return NextResponse.json(
      {
        message: `Please wait ${issued.retryAfterSeconds} seconds before requesting another code.`,
        retryAfterSeconds: issued.retryAfterSeconds,
      },
      { status: 429 },
    );
  }

  const emailResult = await notifyTwoFactorCode({
    to: email,
    code: issued.code,
    companyName: user.companyName ?? user.name,
    expiresInMinutes: Math.round(TWO_FA_CODE_LIFETIME_SECONDS / 60),
  });

  if (!emailResult.delivered) {
    // Don't expose the code; just signal email failure so the user knows.
    return NextResponse.json(
      {
        message:
          "We couldn't send the verification email. Please contact the Admin team.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    requires2fa: true,
    expiresInMinutes: Math.round(TWO_FA_CODE_LIFETIME_SECONDS / 60),
  });
}
