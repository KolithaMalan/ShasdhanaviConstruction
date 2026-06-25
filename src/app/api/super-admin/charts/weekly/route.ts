import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { MovementLogModel } from "@/models/MovementLog";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireRole(["SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  await connectDB();
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const docs = await MovementLogModel.aggregate([
    { $match: { scannedAt: { $gte: start } } },
    {
      $group: {
        _id: {
          y: { $year: "$scannedAt" },
          m: { $month: "$scannedAt" },
          d: { $dayOfMonth: "$scannedAt" },
          dir: "$direction",
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const buckets = new Map<string, { date: string; in: number; out: number }>();
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { date: key, in: 0, out: 0 });
  }
  for (const r of docs) {
    const d = new Date(Date.UTC(r._id.y, r._id.m - 1, r._id.d));
    const key = d.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (r._id.dir === "IN") bucket.in = r.count;
    else if (r._id.dir === "OUT") bucket.out = r.count;
  }

  return NextResponse.json({ items: Array.from(buckets.values()) });
}
