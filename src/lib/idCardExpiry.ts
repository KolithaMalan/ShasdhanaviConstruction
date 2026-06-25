import { differenceInCalendarDays } from "date-fns";

/**
 * Pure client-safe helper — does NOT import Mongoose or any DB models.
 * Safe to use from React client components.
 *
 * Days until an ID card expires. Negative = already expired.
 */
export function daysUntilExpiry(
  expiresAt: Date | string | null | undefined,
): number | null {
  if (!expiresAt) return null;
  return differenceInCalendarDays(new Date(expiresAt), new Date());
}
