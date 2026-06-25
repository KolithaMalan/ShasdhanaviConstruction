import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { authConfig } from "@/lib/auth.config";
import { loginSchema } from "@/lib/validators";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import { verifyTwoFactorCode } from "@/lib/twofactor";
import { logAction } from "@/lib/auditLogger";
import type { Role } from "@/types";

/**
 * Custom error subclasses so the client (signIn) can distinguish "wrong
 * credentials" from a missing/invalid 2FA code.
 */
class TwoFactorRequiredError extends CredentialsSignin {
  override code = "two_factor_required";
}
class TwoFactorInvalidError extends CredentialsSignin {
  override code = "two_factor_invalid";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        code: { label: "Code", type: "text" },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password, code } = parsed.data;

        await connectDB();

        const user = await UserModel.findOne({
          email: email.toLowerCase().trim(),
          isActive: true,
        })
          .select("+password")
          .lean();

        if (!user) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        /* First-time verification gate — contractors only.
           After a contractor verifies once we stamp `verifiedAt` and they
           skip the code on subsequent logins. */
        const needsVerification = user.role === "CONTRACTOR" && !user.verifiedAt;
        if (needsVerification) {
          if (!code) {
            throw new TwoFactorRequiredError();
          }
          const verify = await verifyTwoFactorCode(user.email, code);
          if (!verify.ok) {
            throw new TwoFactorInvalidError();
          }
          try {
            await UserModel.updateOne(
              { _id: user._id },
              { $set: { verifiedAt: new Date() } },
            );
          } catch { /* ignore */ }
        }

        /* Update lastLoginAt + audit log (fire-and-forget) */
        try {
          await UserModel.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
        } catch { /* ignore */ }
        void logAction({
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          userRole: user.role,
          action: "LOGIN",
          entityType: "User",
          entityId: String(user._id),
          description: `${user.email} signed in`,
        });

        return {
          id: String(user._id),
          email: user.email,
          name: user.name,
          role: user.role as Role,
        };
      },
    }),
  ],
});
