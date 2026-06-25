import { NextResponse } from "next/server";
import mongoose from "mongoose";

import sharp from "sharp";

import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { uploadPhoto, buildPhotoUrl } from "@/lib/photoService";
import { logAction } from "@/lib/auditLogger";
import { requireRole, jsonError } from "@/lib/api";

export const runtime = "nodejs";

interface Body { photoDataUrl?: string }

function decodeDataUrl(dataUrl: string): Buffer {
  const match = /^data:image\/(?:png|jpe?g|webp);base64,(.+)$/i.exec(dataUrl.trim());
  if (!match) throw new Error("Invalid image data URL");
  return Buffer.from(match[1]!, "base64");
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(["HSEQ_OFFICER", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body.photoDataUrl) return jsonError("photoDataUrl is required", 422);

  await connectDB();
  const doc = await EmployeeModel.findById(id);
  if (!doc) return jsonError("Not found", 404);
  /* HSEQ can retake / refresh a photo at any non-terminal lifecycle stage.
     We deliberately exclude BLOCKED and MEDICAL_REJECTED — those employees
     should be unblocked first via Admin. */
  if (!["MEDICAL_PASSED", "INDUCTION_COMPLETED", "ACTIVE", "DEACTIVATED"].includes(doc.status)) {
    return jsonError("Employee is not eligible for a photo update", 409);
  }

  let buffer: Buffer;
  try {
    buffer = decodeDataUrl(body.photoDataUrl);
  } catch {
    return jsonError("Invalid photo data", 422);
  }

  /* Phase 7 — process once with sharp, then write the bytes directly to
     the Employee document. This colocates the photo with the record and
     removes the dependency on the separate Photo collection (which has
     proven unreliable on some MongoDB drivers + Mongoose Binary combos). */
  let processed: Buffer;
  try {
    processed = await sharp(buffer)
      .rotate()
      .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
  } catch (err) {
    return jsonError(
      `Image processing failed: ${err instanceof Error ? err.message : "unknown"}`,
      422,
    );
  }

  /* Use updateOne with $set so the photo bytes are written via a direct
     MongoDB operation. Going through `doc.save()` is unreliable here:
     `photoData` has `select: false` on the schema, so the field is never
     loaded by `findById`. Mongoose's document-level dirty tracker can't
     compare against an unloaded value and may silently skip the write. */
  const photoUrl = buildPhotoUrl("EMPLOYEE", doc.nicNumber);
  const updateResult = await EmployeeModel.updateOne(
    { _id: doc._id },
    {
      $set: {
        photoData: processed,
        photoMimeType: "image/jpeg",
        photoUrl,
      },
    },
  );
  if (updateResult.matchedCount !== 1) {
    return jsonError("Failed to attach photo to employee record", 500);
  }

  /* Verify the bytes actually persisted. If the photoData write was lost
     for any driver-level reason, surface it instead of silently telling
     the client everything is fine. */
  const verify = await EmployeeModel.findById(doc._id)
    .select("+photoData")
    .lean();
  const verifyBuf = verify?.photoData as unknown as Buffer | undefined;
  if (!verifyBuf || (verifyBuf as Buffer).length === 0) {
    return jsonError("Photo upload could not be persisted — please retry", 500);
  }

  /* Still upsert to the Photo collection as a back-compat side-effect for
     other views (super-admin lists, security panel, etc.). If this fails
     for any reason the ID-card flow is unaffected because the photo lives
     on the employee doc now. */
  try {
    await uploadPhoto({
      entityType: "EMPLOYEE",
      entityId: doc.nicNumber,
      referenceId: doc._id,
      imageBuffer: buffer,
      uploadedBy: guard.session.user.id,
      fileName: `employee-${doc.nicNumber}.jpg`,
    });
  } catch (err) {
    console.warn(
      "[upload-photo] Photo-collection mirror failed (non-fatal):",
      err instanceof Error ? err.message : err,
    );
  }

  const url = photoUrl;

  void logAction({
    userId: guard.session.user.id,
    userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "",
    userRole: guard.session.user.role,
    action: "UPLOAD_PHOTO",
    entityType: "Employee",
    entityId: String(doc._id),
    description: `Captured employee photo for ${doc.name} (${doc.nicNumber})`,
    request: req,
  });

  return NextResponse.json({ ok: true, photoUrl: url });
}
