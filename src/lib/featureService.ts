import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { RoleFeatureModel } from "@/models/RoleFeature";
import { isToggleableRole } from "@/lib/features";
import type { Role } from "@/types";

/**
 * Server-side reads/writes for the per-role feature switches. Kept apart from
 * `lib/features.ts` (the pure registry) so client components can import the
 * registry without pulling mongoose in.
 */

/** Disabled feature keys for a role. Always empty for non-toggleable roles. */
export async function getDisabledFeatures(role: Role): Promise<string[]> {
  if (!isToggleableRole(role)) return [];
  await connectDB();
  const doc = await RoleFeatureModel.findOne({ role }).lean();
  return doc?.disabled ?? [];
}

/** Disabled keys for every role, keyed by role. */
export async function getAllDisabledFeatures(): Promise<Record<string, string[]>> {
  await connectDB();
  const docs = await RoleFeatureModel.find({}).lean();
  const out: Record<string, string[]> = {};
  for (const d of docs) out[d.role] = d.disabled ?? [];
  return out;
}

export async function setDisabledFeatures(
  role: Role,
  disabled: string[],
  updatedByName: string,
): Promise<string[]> {
  await connectDB();
  const doc = await RoleFeatureModel.findOneAndUpdate(
    { role },
    { $set: { disabled, updatedByName } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  return doc?.disabled ?? [];
}

export async function isFeatureEnabled(role: Role, key: string): Promise<boolean> {
  const disabled = await getDisabledFeatures(role);
  return !disabled.includes(key);
}

/**
 * API guard. Returns a 403 `Response` when the Super Admin has switched the
 * feature off for this role, otherwise null.
 *
 *   const blocked = await requireFeature(guard.session.user.role, "action:gate.scan");
 *   if (blocked) return blocked;
 */
export async function requireFeature(role: Role, key: string): Promise<Response | null> {
  if (await isFeatureEnabled(role, key)) return null;
  return NextResponse.json(
    { message: "This feature has been disabled for your role by the Super Admin." },
    { status: 403 },
  );
}
