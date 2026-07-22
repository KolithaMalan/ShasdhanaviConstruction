import { NextResponse } from "next/server";
import { z } from "zod";

import { requireRole, jsonError } from "@/lib/api";
import { getAllDisabledFeatures, setDisabledFeatures } from "@/lib/featureService";
import { TOGGLEABLE_ROLES, featuresForRole, type ToggleableRole } from "@/lib/features";
import { logAction } from "@/lib/auditLogger";

export const runtime = "nodejs";

const patchSchema = z.object({
  role: z.enum(TOGGLEABLE_ROLES),
  disabled: z.array(z.string().max(200)).max(200),
});

/** Current on/off state of every feature, for every toggleable role. */
export async function GET() {
  const guard = await requireRole(["SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const disabledByRole = await getAllDisabledFeatures();

  const roles = TOGGLEABLE_ROLES.map((role) => {
    const { pages, actions } = featuresForRole(role);
    return { role, disabled: disabledByRole[role] ?? [], pages, actions };
  });

  return NextResponse.json({ roles });
}

/** Replaces the disabled set for one role. */
export async function PATCH(req: Request) {
  const guard = await requireRole(["SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid payload", 422);

  const role = parsed.data.role as ToggleableRole;

  /* Only accept keys that actually exist for this role — a stale client must
     not be able to persist junk that silently blocks nothing. */
  const { pages, actions } = featuresForRole(role);
  const valid = new Set([...pages, ...actions].map((f) => f.key));
  const disabled = [...new Set(parsed.data.disabled.filter((k) => valid.has(k)))];

  const saved = await setDisabledFeatures(role, disabled, guard.session.user.name ?? "");

  void logAction({
    userId: guard.session.user.id,
    userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "",
    userRole: guard.session.user.role,
    action: "UPDATE",
    entityType: "RoleFeature",
    entityId: role,
    description: disabled.length
      ? `Disabled ${disabled.length} feature(s) for ${role}`
      : `Enabled all features for ${role}`,
    metadata: { role, disabled },
    request: req,
  });

  return NextResponse.json({ ok: true, role, disabled: saved });
}
