import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { checkExpiredIdCards } from "@/lib/idCardChecker";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function POST() {
  const guard = await requireRole(["SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  await connectDB();
  const result = await checkExpiredIdCards();
  return NextResponse.json({ ok: true, ...result });
}
