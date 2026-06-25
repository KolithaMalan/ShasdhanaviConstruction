import bcrypt from "bcryptjs";

import { TwoFactorCodeModel } from "@/models/TwoFactorCode";

const CODE_LIFETIME_MS = 10 * 60 * 1000;         // 10 minutes
const RESEND_COOLDOWN_MS = 30 * 1000;            // 30 seconds between sends
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;               // 15 minute lockout after 5 fails

export const TWO_FA_CODE_LIFETIME_SECONDS = CODE_LIFETIME_MS / 1000;
export const TWO_FA_LOCKOUT_SECONDS = LOCKOUT_MS / 1000;

export function generateNumericCode(): string {
  // Inclusive [10000, 99999] — always 5 digits
  return String(Math.floor(10000 + Math.random() * 90000));
}

interface IssueResult {
  ok: true;
  code: string;
  expiresAt: Date;
}
interface ThrottledResult {
  ok: false;
  reason: "RATE_LIMIT" | "LOCKED_OUT";
  retryAfterSeconds: number;
}

/**
 * Issue a fresh 2FA code for `email`. Invalidates any pending code for
 * the same email. Returns the plaintext code (caller should email it),
 * unless we are inside the resend-cooldown window.
 */
export async function issueTwoFactorCode(email: string): Promise<IssueResult | ThrottledResult> {
  const normalized = email.toLowerCase().trim();
  const now = new Date();

  /* Lockout check — any code locked beyond `now` blocks new issuance. */
  const lockedDoc = await TwoFactorCodeModel.findOne({
    email: normalized,
    lockedUntil: { $gt: now },
  })
    .sort({ lockedUntil: -1 })
    .lean();
  if (lockedDoc?.lockedUntil) {
    return {
      ok: false,
      reason: "LOCKED_OUT",
      retryAfterSeconds: Math.ceil((new Date(lockedDoc.lockedUntil).getTime() - now.getTime()) / 1000),
    };
  }

  const last = await TwoFactorCodeModel.findOne({ email: normalized, consumed: false })
    .sort({ lastSentAt: -1 })
    .lean();

  if (last) {
    const elapsed = now.getTime() - new Date(last.lastSentAt).getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      return {
        ok: false,
        reason: "RATE_LIMIT",
        retryAfterSeconds: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000),
      };
    }
  }

  const code = generateNumericCode();
  const codeHash = await bcrypt.hash(code, 8);
  const expiresAt = new Date(now.getTime() + CODE_LIFETIME_MS);

  // Mark any prior pending codes consumed so only the latest one is usable.
  await TwoFactorCodeModel.updateMany(
    { email: normalized, consumed: false },
    { $set: { consumed: true } },
  );

  await TwoFactorCodeModel.create({
    email: normalized,
    codeHash,
    expiresAt,
    attempts: 0,
    consumed: false,
    lastSentAt: now,
  });

  return { ok: true, code, expiresAt };
}

interface VerifyOk { ok: true }
interface VerifyFail {
  ok: false;
  reason: "NO_CODE" | "EXPIRED" | "INVALID" | "TOO_MANY_ATTEMPTS";
  attemptsRemaining?: number;
}

/**
 * Verify a submitted 5-digit code against the most recent pending code.
 * On success, the code is marked consumed and may not be reused.
 */
export async function verifyTwoFactorCode(
  email: string,
  candidate: string,
): Promise<VerifyOk | VerifyFail> {
  const normalized = email.toLowerCase().trim();
  const cleaned = candidate.replace(/\s+/g, "");

  if (!/^\d{5}$/.test(cleaned)) return { ok: false, reason: "INVALID" };

  const doc = await TwoFactorCodeModel.findOne({
    email: normalized,
    consumed: false,
  }).sort({ lastSentAt: -1 });

  if (!doc) return { ok: false, reason: "NO_CODE" };

  if (doc.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "EXPIRED" };
  }

  if (doc.lockedUntil && doc.lockedUntil.getTime() > Date.now()) {
    return { ok: false, reason: "TOO_MANY_ATTEMPTS" };
  }
  if (doc.attempts >= MAX_ATTEMPTS) {
    doc.consumed = true;
    doc.lockedUntil = new Date(Date.now() + LOCKOUT_MS);
    await doc.save();
    return { ok: false, reason: "TOO_MANY_ATTEMPTS" };
  }

  const matches = await bcrypt.compare(cleaned, doc.codeHash);
  if (!matches) {
    doc.attempts += 1;
    if (doc.attempts >= MAX_ATTEMPTS) {
      doc.consumed = true;
      doc.lockedUntil = new Date(Date.now() + LOCKOUT_MS);
    }
    await doc.save();
    return {
      ok: false,
      reason: "INVALID",
      attemptsRemaining: Math.max(0, MAX_ATTEMPTS - doc.attempts),
    };
  }

  doc.consumed = true;
  await doc.save();
  return { ok: true };
}
