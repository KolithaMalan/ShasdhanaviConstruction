import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { WorkerModel } from "@/models/Worker";
import { requireRole, jsonError } from "@/lib/api";
import { decodeImageDataUrl, processProfilePhoto } from "@/lib/photoService";

export const runtime = "nodejs";

/** Serve the worker photo. Gate scanners need this to preview the pass holder. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole([
    "ADMIN_HSEQ",
    "HSEQ_OFFICER",
    "SUPER_ADMIN",
    "SECURITY_OFFICER",
  ]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  await connectDB();
  const doc = await WorkerModel.findById(id).select("+photoData +photoMimeType").exec();
  if (!doc?.photoData) return jsonError("No photo", 404);

  const raw = doc.photoData as unknown;
  let body: Buffer | null = null;
  if (Buffer.isBuffer(raw)) {
    body = raw;
  } else if (
    raw &&
    typeof raw === "object" &&
    "buffer" in (raw as Record<string, unknown>) &&
    Buffer.isBuffer((raw as { buffer: unknown }).buffer)
  ) {
    body = (raw as { buffer: Buffer }).buffer;
  }
  if (!body || body.length === 0) return jsonError("No photo", 404);

  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": doc.photoMimeType || "image/jpeg",
      "Cache-Control": "no-store",
    },
  });
}

interface Body { photoDataUrl?: string }

/** Replace the worker photo (re-capture / re-upload). */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(["HSEQ_OFFICER", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  const data = (await req.json().catch(() => ({}))) as Body;
  if (!data.photoDataUrl) return jsonError("photoDataUrl is required", 422);

  let processed: Buffer;
  try {
    processed = await processProfilePhoto(decodeImageDataUrl(data.photoDataUrl));
  } catch {
    return jsonError("Invalid photo data", 422);
  }

  await connectDB();
  const photoUrl = `/api/hseq/workers/${id}/photo`;
  const res = await WorkerModel.updateOne(
    { _id: id },
    { $set: { photoData: processed, photoMimeType: "image/jpeg", photoUrl } },
  );
  if (res.matchedCount === 0) return jsonError("Not found", 404);

  return new Response(JSON.stringify({ photoUrl }), {
    headers: { "Content-Type": "application/json" },
  });
}
