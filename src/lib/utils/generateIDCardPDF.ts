import { renderToBuffer } from "@react-pdf/renderer";
import { promises as fs } from "node:fs";
import path from "node:path";

import type { EmployeeDocument } from "@/models/Employee";
import { EmployeeModel } from "@/models/Employee";
import { serializeEmployee, type SerializedEmployee } from "@/lib/employee";
import { qrPngDataUrl } from "@/lib/qr";
import { PhotoModel } from "@/models/Photo";
import { IdCardPdf, BulkIdCardsPdf } from "@/components/pdf/IdCardPdf";

/**
 * Resolve an employee photo to a base64 data URL for inline embedding
 * inside react-pdf. Tries every realistic storage location in turn:
 *   1. data: URL already stored directly on employee.photoUrl
 *   2. Photo collection keyed by NIC          (HSEQ induction upload)
 *   3. Photo collection keyed by employeeId   (photos/upload generic path)
 *   4. Photo collection by referenceId        (older induction flows)
 *   5. Legacy filesystem /public/uploads/...
 *   6. Absolute http(s) URL — fetch and inline
 */
async function fetchPhotoByEntityId(
  entityId: string,
): Promise<string | null> {
  if (!entityId) return null;
  const doc = await PhotoModel.findOne({ entityType: "EMPLOYEE", entityId })
    .select("data mimeType")
    .lean();
  if (!doc?.data) return null;
  const b = Buffer.isBuffer(doc.data) ? doc.data : Buffer.from(doc.data as unknown as Buffer);
  return `data:${doc.mimeType || "image/jpeg"};base64,${b.toString("base64")}`;
}

async function resolvePhotoDataUrl(
  doc: EmployeeDocument,
): Promise<string | null> {
  /* 0. canonical Phase 7 storage — photo bytes embedded directly on the
     employee document. This is the authoritative source for newly
     inducted employees. Don't use `.lean()` here: it returns Buffer
     fields as BSON Binary objects whose bytes don't survive the
     `Buffer.from(...)` round-trip, leaving us with an empty data URL. */
  try {
    const fresh = await EmployeeModel.findById(doc._id)
      .select("+photoData +photoMimeType")
      .exec();
    if (fresh?.photoData) {
      const raw = fresh.photoData as unknown;
      let b: Buffer | null = null;
      if (Buffer.isBuffer(raw)) {
        b = raw;
      } else if (
        raw &&
        typeof raw === "object" &&
        "buffer" in (raw as Record<string, unknown>) &&
        Buffer.isBuffer((raw as { buffer: unknown }).buffer)
      ) {
        b = (raw as { buffer: Buffer }).buffer;
      }
      if (b && b.length > 0) {
        const mime = fresh.photoMimeType || "image/jpeg";
        return `data:${mime};base64,${b.toString("base64")}`;
      }
    }
  } catch { /* ignore */ }

  /* 1. inline data: URL — already self-contained */
  if (doc.photoUrl?.startsWith("data:image/")) {
    return doc.photoUrl;
  }

  /* 2-3. canonical Photo collection lookups */
  try {
    const byNic = await fetchPhotoByEntityId(doc.nicNumber);
    if (byNic) return byNic;
  } catch { /* ignore */ }
  if (doc.employeeId) {
    try {
      const byEmpId = await fetchPhotoByEntityId(doc.employeeId);
      if (byEmpId) return byEmpId;
    } catch { /* ignore */ }
  }

  /* 4. referenceId fallback — some flows only set referenceId, not entityId */
  try {
    const byRef = await PhotoModel.findOne({
      entityType: "EMPLOYEE",
      referenceId: doc._id,
    })
      .select("data mimeType")
      .lean();
    if (byRef?.data) {
      const b = Buffer.isBuffer(byRef.data) ? byRef.data : Buffer.from(byRef.data as unknown as Buffer);
      return `data:${byRef.mimeType || "image/jpeg"};base64,${b.toString("base64")}`;
    }
  } catch { /* ignore */ }

  /* 5. legacy filesystem path under /public/uploads */
  if (doc.photoUrl?.startsWith("/uploads/")) {
    try {
      const fullPath = path.join(process.cwd(), "public", doc.photoUrl.replace(/^\//, ""));
      const buf = await fs.readFile(fullPath);
      const ext = path.extname(fullPath).slice(1).toLowerCase();
      const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      return `data:${mime};base64,${buf.toString("base64")}`;
    } catch { /* fall through */ }
  }

  /* 6. absolute http(s) URL — fetch and inline */
  if (doc.photoUrl && /^https?:\/\//i.test(doc.photoUrl)) {
    try {
      const res = await fetch(doc.photoUrl);
      if (res.ok) {
        const ab = await res.arrayBuffer();
        const mime = res.headers.get("content-type") ?? "image/jpeg";
        return `data:${mime};base64,${Buffer.from(ab).toString("base64")}`;
      }
    } catch { /* ignore */ }
  }

  return null;
}

interface CardInput {
  employee: SerializedEmployee;
  qrDataUrl: string;
  photoAbsoluteUrl: string | null;
}

/** Build the data needed to render one card from a raw Employee document. */
async function buildCardInput(doc: EmployeeDocument): Promise<CardInput | null> {
  if (!doc.qrCodeData) return null;
  const employee = serializeEmployee(doc);
  const [qrDataUrl, photoAbsoluteUrl] = await Promise.all([
    qrPngDataUrl(doc.qrCodeData),
    resolvePhotoDataUrl(doc),
  ]);
  return { employee, qrDataUrl, photoAbsoluteUrl };
}

/** Render a single employee's ID card to a PDF buffer. */
export async function generateIDCardPDF(doc: EmployeeDocument): Promise<Buffer> {
  const input = await buildCardInput(doc);
  if (!input) {
    throw new Error("Employee has no QR code on file");
  }
  const React = await import("react");
  const element = React.createElement(IdCardPdf, input);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(element as any);
}

/** Render many employees into a single multi-page PDF buffer. */
export async function generateBulkPDF(docs: EmployeeDocument[]): Promise<Buffer> {
  const inputs = (
    await Promise.all(docs.map((d) => buildCardInput(d).catch(() => null)))
  ).filter((x): x is CardInput => x !== null);

  if (inputs.length === 0) {
    throw new Error("No employees with valid QR codes to render");
  }

  const React = await import("react");
  const element = React.createElement(BulkIdCardsPdf, { cards: inputs });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(element as any);
}
