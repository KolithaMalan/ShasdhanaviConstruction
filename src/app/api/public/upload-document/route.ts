import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { DocumentModel, DOCUMENT_KINDS, type DocumentKind } from "@/models/Document";
import { jsonError } from "@/lib/api";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

/**
 * PUBLIC variant: accepts multipart upload from the pre-registration form.
 * Returns the new Document _id which the form keeps as a reference until
 * submission. After approval the registration POST endpoint links these
 * Documents to the new ContractorRegistration.
 */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return jsonError("Invalid form upload", 400);

  const file = form.get("file");
  const kind = String(form.get("kind") ?? "").toUpperCase();
  const uploaderEmail = String(form.get("uploaderEmail") ?? "").trim().toLowerCase();

  if (!(file instanceof File)) return jsonError("Missing file", 400);
  if (!DOCUMENT_KINDS.includes(kind as DocumentKind)) {
    return jsonError("Invalid document kind", 400);
  }
  if (file.size === 0) return jsonError("File is empty", 400);
  if (file.size > MAX_BYTES) return jsonError("File exceeds 10 MB limit", 400);
  if (!ALLOWED_MIME.has(file.type)) {
    return jsonError("Unsupported file type — use PDF, image, or Word", 400);
  }

  await connectDB();
  const buf = Buffer.from(await file.arrayBuffer());

  const doc = await DocumentModel.create({
    kind: kind as DocumentKind,
    uploaderEmail: uploaderEmail || "",
    fileName: file.name || `${kind.toLowerCase()}.bin`,
    mimeType: file.type,
    fileSize: file.size,
    data: buf,
  });

  return NextResponse.json({
    id: String(doc._id),
    fileName: doc.fileName,
    fileSize: doc.fileSize,
    mimeType: doc.mimeType,
  });
}
