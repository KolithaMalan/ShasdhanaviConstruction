import sharp from "sharp";
import mongoose from "mongoose";

import { PhotoModel, type PhotoDocument } from "@/models/Photo";
import type { PhotoEntityType } from "@/types";

interface UploadInput {
  entityType: PhotoEntityType;
  entityId: string;
  referenceId?: string | mongoose.Types.ObjectId | null;
  imageBuffer: Buffer;
  uploadedBy?: string | mongoose.Types.ObjectId | null;
  fileName?: string;
}

/**
 * Pipeline: orient → resize (max 800×800 contain) → strip metadata → JPEG q80.
 * Also produces a 100×100 cover-crop thumbnail.
 *
 * Always upserts on (entityType, entityId) — overwriting any prior photo.
 */
export async function uploadPhoto(input: UploadInput): Promise<PhotoDocument> {
  const base = sharp(input.imageBuffer).rotate();
  const meta = await base.metadata();

  const main = await base
    .clone()
    .resize({
      width: 800,
      height: 800,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  const thumb = await sharp(input.imageBuffer)
    .rotate()
    .resize({ width: 100, height: 100, fit: "cover", position: "centre" })
    .jpeg({ quality: 75, mozjpeg: true })
    .toBuffer();

  const doc = await PhotoModel.findOneAndUpdate(
    { entityType: input.entityType, entityId: input.entityId },
    {
      entityType: input.entityType,
      entityId: input.entityId,
      referenceId: input.referenceId ?? null,
      fileName: input.fileName ?? `${input.entityType.toLowerCase()}-${input.entityId}.jpg`,
      mimeType: "image/jpeg",
      fileSize: main.info.size,
      width: main.info.width,
      height: main.info.height,
      data: main.data,
      thumbnail: thumb,
      thumbnailMimeType: "image/jpeg",
      uploadedBy: input.uploadedBy ?? null,
      uploadedAt: new Date(),
      ...(meta && {}),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return doc as PhotoDocument;
}

export async function getPhoto(entityType: PhotoEntityType, entityId: string) {
  return PhotoModel.findOne({ entityType, entityId }).lean();
}

export async function getPhotoThumbnail(entityType: PhotoEntityType, entityId: string) {
  const doc = await PhotoModel.findOne({ entityType, entityId })
    .select("thumbnail thumbnailMimeType")
    .lean();
  if (!doc?.thumbnail) return null;
  return { buffer: doc.thumbnail as unknown as Buffer, mimeType: doc.thumbnailMimeType };
}

export async function deletePhoto(entityType: PhotoEntityType, entityId: string) {
  await PhotoModel.deleteOne({ entityType, entityId });
}

/** Returns a base64 data URL for inline rendering (PDF, react-pdf, etc.). */
export async function getPhotoAsBase64Url(
  entityType: PhotoEntityType,
  entityId: string,
): Promise<string | null> {
  const doc = await PhotoModel.findOne({ entityType, entityId })
    .select("data mimeType")
    .lean();
  if (!doc?.data) return null;
  const b = Buffer.isBuffer(doc.data) ? doc.data : Buffer.from(doc.data as unknown as Buffer);
  return `data:${doc.mimeType};base64,${b.toString("base64")}`;
}

/** Builds the canonical photo URL for an entity (served by /api/photos). */
export function buildPhotoUrl(entityType: PhotoEntityType, entityId: string): string {
  const safe = encodeURIComponent(entityId);
  return `/api/photos/${entityType}/${safe}`;
}

/** Decodes a base64 image data URL (png/jpeg/webp) into a Buffer. */
export function decodeImageDataUrl(dataUrl: string): Buffer {
  const match = /^data:image\/(?:png|jpe?g|webp);base64,(.+)$/i.exec(dataUrl.trim());
  if (!match) throw new Error("Invalid image data URL");
  return Buffer.from(match[1]!, "base64");
}

/** Orient → resize (max 800×800 contain) → strip metadata → JPEG q82.
 *  Returns a processed JPEG buffer for embedding directly on a document. */
export async function processProfilePhoto(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}
