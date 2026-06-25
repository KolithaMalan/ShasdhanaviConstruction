/* Server-only — touches Mongoose. Do NOT import this from client components.
   Client code that just needs `daysUntilExpiry` should pull it from
   `@/lib/idCardExpiry` instead. */
import { EmployeeModel } from "@/models/Employee";

export { daysUntilExpiry } from "@/lib/idCardExpiry";

/**
 * Deactivate any ACTIVE employee whose ID card has expired.
 * Safe to call as often as needed — short-circuits if nothing matches.
 */
export async function checkExpiredIdCards(): Promise<{ deactivated: number }> {
  const now = new Date();
  const res = await EmployeeModel.updateMany(
    { status: "ACTIVE", idCardExpiresAt: { $lte: now } },
    { $set: { status: "DEACTIVATED" } },
  );
  return { deactivated: res.modifiedCount ?? 0 };
}
