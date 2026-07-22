import { roleConfig } from "@/config/roles";
import type { Role } from "@/types";

/**
 * Per-role feature registry.
 *
 * The Super Admin can switch individual features on/off for each role from
 * Super Admin → Role Features. Two kinds exist:
 *
 *  - PAGE   — a dashboard screen. Turning it off hides the sidebar entry and
 *             blocks the route (see the (dashboard) layout guard).
 *  - ACTION — an operation that isn't a whole screen (e.g. "scan a gate QR").
 *             Turning it off makes the relevant API return 403.
 *
 * This module is intentionally free of any DB/mongoose import so it can be
 * used from client components too. DB access lives in `featureService.ts`.
 */

/** Roles whose features are toggleable. Super Admin is deliberately excluded —
 *  it must never be able to lock itself out of this very screen. */
export const TOGGLEABLE_ROLES = [
  "ADMIN_HSEQ",
  "MEDICAL_OFFICER",
  "HSEQ_OFFICER",
  "SECURITY_OFFICER",
  "INTERNAL_SECURITY",
  "CONTRACTOR",
] as const;

export type ToggleableRole = (typeof TOGGLEABLE_ROLES)[number];

export function isToggleableRole(role: Role): role is ToggleableRole {
  return (TOGGLEABLE_ROLES as readonly string[]).includes(role);
}

export interface FeatureDef {
  key: string;
  label: string;
  description: string;
  kind: "PAGE" | "ACTION";
  /** PAGE features only — the nav href this feature corresponds to. */
  href?: string;
}

export function pageFeatureKey(href: string): string {
  return `page:${href}`;
}

/** Strips the query string so hrefs like `/admin/registrations?status=APPROVED`
 *  can be compared against a request pathname. */
function pathOf(href: string): string {
  const q = href.indexOf("?");
  return q === -1 ? href : href.slice(0, q);
}

/**
 * Actions that are not a whole screen. Each key is enforced inside the API
 * route(s) named in the description so turning it off actually stops the work,
 * not just the link.
 */
const ACTION_FEATURES: Record<ToggleableRole, FeatureDef[]> = {
  ADMIN_HSEQ: [
    {
      key: "action:registration.approve",
      label: "Approve registrations & requests",
      description:
        "Approve or reject contractor registrations and additional labour/vehicle/equipment requests.",
      kind: "ACTION",
    },
  ],
  MEDICAL_OFFICER: [
    {
      key: "action:medical.clear",
      label: "Record medical pass / fail",
      description: "Submit a medical screening result that clears or fails an employee.",
      kind: "ACTION",
    },
  ],
  HSEQ_OFFICER: [
    {
      key: "action:gate.scan",
      label: "Gate QR scanning",
      description:
        "Scan a QR/ID at the gate and record IN/OUT movements for employees, workers and vehicles.",
      kind: "ACTION",
    },
    {
      key: "action:permanent.register",
      label: "Register permanent employees",
      description: "Create new permanent employee records and issue their ID cards.",
      kind: "ACTION",
    },
    {
      key: "action:worker.register",
      label: "Register Yugadhanavi / Sobadhanavi workers",
      description: "Create new worker records and issue their ID cards.",
      kind: "ACTION",
    },
  ],
  SECURITY_OFFICER: [
    {
      key: "action:gate.scan",
      label: "Gate QR scanning",
      description:
        "Scan a QR/ID at the gate and record IN/OUT movements for employees, workers and vehicles.",
      kind: "ACTION",
    },
  ],
  INTERNAL_SECURITY: [
    {
      key: "action:gatepass.process",
      label: "Process tool gate passes",
      description: "Approve tool/equipment IN/OUT movements against a gate pass.",
      kind: "ACTION",
    },
  ],
  CONTRACTOR: [
    {
      key: "action:contractor.request",
      label: "Submit additional requests",
      description: "Request additional labour, vehicles or equipment after approval.",
      kind: "ACTION",
    },
  ],
};

/**
 * Every feature a role has, split by kind. The role's own dashboard home is
 * never toggleable — switching it off would leave the user with nowhere to
 * land after signing in.
 */
export function featuresForRole(role: ToggleableRole): {
  pages: FeatureDef[];
  actions: FeatureDef[];
} {
  const cfg = roleConfig[role];
  const pages: FeatureDef[] = cfg.nav
    .filter((item) => item.href !== cfg.dashboardPath)
    .map((item) => ({
      key: pageFeatureKey(item.href),
      label: item.label,
      description: `Sidebar screen · ${item.href}`,
      kind: "PAGE" as const,
      href: item.href,
    }));

  return { pages, actions: ACTION_FEATURES[role] ?? [] };
}

/** Nav entries for a role with disabled screens removed. */
export function visibleNavForRole(role: Role, disabled: string[]) {
  const cfg = roleConfig[role];
  if (!isToggleableRole(role) || disabled.length === 0) return cfg.nav;
  const off = new Set(disabled);
  return cfg.nav.filter((item) => !off.has(pageFeatureKey(item.href)));
}

/**
 * Returns the label of the disabled screen covering `pathname`, or null when
 * access is allowed.
 *
 * Only hrefs without a query string can be matched against a pathname — an
 * href like `/admin/registrations?status=APPROVED` shares its path with
 * another nav entry, so it is hidden from the sidebar but not route-blocked.
 */
export function blockedPageFor(
  role: Role,
  disabled: string[],
  pathname: string,
): string | null {
  if (!isToggleableRole(role) || disabled.length === 0 || !pathname) return null;
  const cfg = roleConfig[role];

  for (const item of cfg.nav) {
    if (item.href === cfg.dashboardPath) continue;
    if (item.href.includes("?")) continue;
    if (!disabled.includes(pageFeatureKey(item.href))) continue;

    const base = pathOf(item.href);
    if (pathname === base || pathname.startsWith(`${base}/`)) return item.label;
  }
  return null;
}
