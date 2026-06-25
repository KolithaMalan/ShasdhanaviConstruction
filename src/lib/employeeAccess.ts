import type { Role } from "@/types";
import type { EmployeeDocument } from "@/models/Employee";

/**
 * Centralised scope check for employee resources.
 * SUPER_ADMIN / ADMIN_HSEQ / HSEQ_OFFICER  → any employee
 * CONTRACTOR                                → only employees whose
 *                                             contractorId matches the
 *                                             signed-in user's id.
 * Any other role                            → denied.
 */
export function canAccessEmployee(
  role: Role,
  userId: string,
  employee: Pick<EmployeeDocument, "contractorId">,
): boolean {
  if (role === "SUPER_ADMIN" || role === "ADMIN_HSEQ" || role === "HSEQ_OFFICER") {
    return true;
  }
  if (role === "CONTRACTOR") {
    return String(employee.contractorId) === String(userId);
  }
  return false;
}

/** Roles allowed to use the employee QR / ID-card download routes at all. */
export const DOWNLOAD_ROLES: Role[] = [
  "SUPER_ADMIN",
  "ADMIN_HSEQ",
  "HSEQ_OFFICER",
  "CONTRACTOR",
];

/** Build the MongoDB filter that scopes a list query for the active role. */
export function scopedEmployeeFilter(
  role: Role,
  userId: string,
  base: Record<string, unknown> = {},
): Record<string, unknown> {
  if (role === "CONTRACTOR") {
    return { ...base, contractorId: userId };
  }
  return base;
}
