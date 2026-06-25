import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["INTERNAL_SECURITY", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  const filter: Record<string, unknown> = { role: "CONTRACTOR", isActive: true };
  if (q) {
    filter.$or = [
      { companyName: { $regex: q, $options: "i" } },
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  }

  await connectDB();
  const docs = await UserModel.find(filter)
    .select("companyName name email brNumber")
    .sort({ companyName: 1 })
    .limit(200)
    .lean();

  return NextResponse.json({
    items: docs.map((d) => ({
      id: String(d._id),
      companyName: d.companyName ?? d.name,
      email: d.email,
      brNumber: d.brNumber ?? "",
    })),
  });
}
