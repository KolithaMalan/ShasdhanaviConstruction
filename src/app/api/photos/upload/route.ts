import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { uploadPhoto, buildPhotoUrl } from "@/lib/photoService";
import { requireSession, jsonError } from "@/lib/api";
import { logAction } from "@/lib/auditLogger";
import { PHOTO_ENTITY_TYPES, type PhotoEntityType } from "@/types";

export const runtime = "nodejs";

interface JsonBody {
  entityType?: string;
  entityId?: string;
  referenceId?: string;
  photoDataUrl?: string;
}

function decodeDataUrl(dataUrl: string): Buffer {
  const match = /^data:image\/(?:png|jpe?g|webp);base64,(.+)$/i.exec(dataUrl.trim());
  if (!match) throw new Error("Invalid image data URL");
  return Buffer.from(match[1]!, "base64");
}

export async function POST(req: Request) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;
  if (!["SUPER_ADMIN", "ADMIN_HSEQ", "HSEQ_OFFICER", "SECURITY_OFFICER"].includes(guard.session.user.role)) {
    return jsonError("Forbidden", 403);
  }

  const contentType = req.headers.get("content-type") ?? "";
  let entityType: PhotoEntityType | null = null;
  let entityId = "";
  let referenceId: string | null = null;
  let buffer: Buffer | null = null;

  try {
    if (contentType.includes("application/json")) {
      const body = (await req.json()) as JsonBody;
      if (!body.photoDataUrl) return jsonError("photoDataUrl required", 422);
      buffer = decodeDataUrl(body.photoDataUrl);
      entityType = (body.entityType ?? "").toUpperCase() as PhotoEntityType;
      entityId = body.entityId ?? "";
      referenceId = body.referenceId ?? null;
    } else if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      entityType = (String(form.get("entityType") ?? "")).toUpperCase() as PhotoEntityType;
      entityId = String(form.get("entityId") ?? "");
      referenceId = (form.get("referenceId") as string | null) ?? null;
      if (!file || typeof file === "string") return jsonError("file is required", 422);
      const ab = await (file as File).arrayBuffer();
      buffer = Buffer.from(ab);
    } else {
      return jsonError("Unsupported content type", 415);
    }
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Invalid payload", 422);
  }

  if (!entityType || !PHOTO_ENTITY_TYPES.includes(entityType)) {
    return jsonError("Invalid entityType", 422);
  }
  if (!entityId) return jsonError("entityId required", 422);
  if (!buffer) return jsonError("Empty image", 422);

  await connectDB();
  const doc = await uploadPhoto({
    entityType,
    entityId,
    referenceId: referenceId && mongoose.Types.ObjectId.isValid(referenceId)
      ? new mongoose.Types.ObjectId(referenceId)
      : null,
    imageBuffer: buffer,
    uploadedBy: guard.session.user.id,
  });

  void logAction({
    userId: guard.session.user.id,
    userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "",
    userRole: guard.session.user.role,
    action: "UPLOAD_PHOTO",
    entityType: "Photo",
    entityId: `${entityType}/${entityId}`,
    description: `Uploaded ${entityType} photo (${doc.fileSize} bytes, ${doc.width}×${doc.height})`,
    request: req,
  });

  return NextResponse.json({
    ok: true,
    photoUrl: buildPhotoUrl(entityType, entityId),
    fileSize: doc.fileSize,
    width: doc.width,
    height: doc.height,
  });
}
