import { promises as fs } from "node:fs";
import path from "node:path";

const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");

export async function ensureEmployeeUploadDir(): Promise<string> {
  const dir = path.join(UPLOAD_ROOT, "employees");
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Save an employee photo to /public/uploads/employees/{nic}.{ext}.
 * Returns the publicly accessible URL (begins with /uploads/employees/…).
 */
export async function saveEmployeePhoto(
  nic: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const dir = await ensureEmployeeUploadDir();
  const ext = pickExt(contentType);
  const safeNic = nic.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const filename = `${safeNic}.${ext}`;
  const fullPath = path.join(dir, filename);
  await fs.writeFile(fullPath, buffer);
  return `/uploads/employees/${filename}`;
}

function pickExt(contentType: string): "jpg" | "png" | "webp" {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  return "jpg";
}

/** Strip a `data:image/...;base64,` prefix and return the raw Buffer + content-type. */
export function decodeDataUrl(dataUrl: string): { buffer: Buffer; contentType: string } {
  const match = /^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/i.exec(dataUrl);
  if (!match) throw new Error("Invalid image data URL");
  const contentType = match[1]!;
  const data = match[2]!;
  return { buffer: Buffer.from(data, "base64"), contentType };
}
