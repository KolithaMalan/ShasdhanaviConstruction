import { customAlphabet } from "nanoid";
import { addMonths } from "date-fns";

import { EmployeeModel, type EmployeeDocument } from "@/models/Employee";
import { BlacklistedNICModel } from "@/models/BlacklistedNIC";

const nano = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 5);

/** SHA-YYYY-XXXXX */
export function generateEmployeeId(): string {
  return `SHA-${new Date().getFullYear()}-${nano()}`;
}

/** ID-card validity window — 2 months from issue */
export function computeIdCardExpiry(issuedAt: Date): Date {
  return addMonths(issuedAt, 2);
}

interface LabourItem {
  name: string;
  nicNumber: string;
  address?: string;
  mobileNumber?: string;
  emergencyContact?: string;
  tradeType: string;
  designation?: string;
  joinedDate: Date | string;
}

export interface BulkCreateOutcome {
  created: number;
  blocked: { nicNumber: string; reason: string }[];
  skipped: { nicNumber: string; reason: string }[];
}

/**
 * Bulk create Employee documents for an approved contractor/registration.
 * Blacklisted NICs are skipped (returned in `blocked`). Existing employees
 * by NIC are also skipped to avoid duplicates.
 */
export async function bulkCreateEmployees(
  contractorId: string,
  companyName: string,
  labour: LabourItem[],
): Promise<BulkCreateOutcome> {
  const outcome: BulkCreateOutcome = { created: 0, blocked: [], skipped: [] };
  if (labour.length === 0) return outcome;

  const nics = labour.map((l) => l.nicNumber.trim().toUpperCase());

  const [blacklisted, existing] = await Promise.all([
    BlacklistedNICModel.find({ nicNumber: { $in: nics } }).select("nicNumber").lean(),
    EmployeeModel.find({ nicNumber: { $in: nics } }).select("nicNumber").lean(),
  ]);

  const blockedSet = new Set(blacklisted.map((b) => b.nicNumber));
  const existingSet = new Set(existing.map((e) => e.nicNumber));

  for (const l of labour) {
    const nic = l.nicNumber.trim().toUpperCase();

    if (blockedSet.has(nic)) {
      outcome.blocked.push({ nicNumber: nic, reason: "NIC is blacklisted" });
      continue;
    }
    if (existingSet.has(nic)) {
      outcome.skipped.push({ nicNumber: nic, reason: "Already registered" });
      continue;
    }

    await EmployeeModel.create({
      contractorId,
      companyName,
      name: l.name,
      nicNumber: nic,
      address: l.address ?? "",
      mobileNumber: l.mobileNumber ?? "",
      emergencyContact: l.emergencyContact ?? "",
      tradeType: l.tradeType,
      designation: l.designation ?? "",
      joinedDate: new Date(l.joinedDate),
      status: "PENDING_MEDICAL",
      medicalStatus: "PENDING",
      currentStatus: "OUT",
    });
    outcome.created += 1;
  }
  return outcome;
}

/**
 * Find any NICs in a list that exist in the blacklist.
 * Used at submission time to reject contractor forms early.
 */
export async function findBlacklistedNICs(nics: string[]): Promise<string[]> {
  if (nics.length === 0) return [];
  const upper = nics.map((n) => n.trim().toUpperCase());
  const hits = await BlacklistedNICModel.find({ nicNumber: { $in: upper } })
    .select("nicNumber")
    .lean();
  return hits.map((h) => h.nicNumber);
}

/**
 * Find any NICs in a list that are already registered as active employees
 * (excluding MEDICAL_REJECTED / BLOCKED which can be re-registered).
 * Returns an array of { nicNumber, companyName } so callers can craft a
 * helpful error message.
 */
export async function findDuplicateEmployeeNICs(
  nics: string[],
): Promise<{ nicNumber: string; companyName: string }[]> {
  if (nics.length === 0) return [];
  const upper = nics.map((n) => n.trim().toUpperCase());
  const hits = await EmployeeModel.find({
    nicNumber: { $in: upper },
    status: { $nin: ["MEDICAL_REJECTED", "BLOCKED"] },
  })
    .select("nicNumber companyName")
    .lean();
  return hits.map((h) => ({ nicNumber: h.nicNumber, companyName: h.companyName }));
}

/** The serialiser doesn't touch the embedded photo bytes, so its parameter
 *  shape is intentionally loose on those fields — this lets both raw Mongoose
 *  documents and `.lean()` results (which return `Binary` instead of `Buffer`)
 *  flow through without a type mismatch. */
type SerializableEmployee = Omit<EmployeeDocument, "photoData" | "photoMimeType">;

/** Shape a server-side Employee document into a plain JSON-safe row. */
export function serializeEmployee(doc: SerializableEmployee) {
  return {
    id: String(doc._id),
    contractorId: String(doc.contractorId),
    companyName: doc.companyName,
    name: doc.name,
    nicNumber: doc.nicNumber,
    address: doc.address,
    mobileNumber: doc.mobileNumber,
    emergencyContact: doc.emergencyContact,
    tradeType: doc.tradeType,
    designation: doc.designation,
    joinedDate: doc.joinedDate ? new Date(doc.joinedDate).toISOString() : null,
    employeeId: doc.employeeId,
    /* Phase 6 — serve the canonical MongoDB-backed photo URL ONLY when
       the employee actually has a photo on file. An empty string lets
       UIs treat "no photo" as a clean falsy state (eg. disable the
       Complete-Induction button until a photo is captured).
       The `?v=updatedAt` cache-buster forces clients to re-fetch after a
       retake — without it the browser would happily serve the previous
       (possibly-blank) image from its disk cache. */
    photoUrl:
      doc.photoUrl && doc.nicNumber
        ? `/api/photos/EMPLOYEE/${encodeURIComponent(doc.nicNumber)}` +
          ((doc as { updatedAt?: Date | string | null }).updatedAt
            ? `?v=${new Date(
                (doc as { updatedAt: Date | string }).updatedAt,
              ).getTime()}`
            : "")
        : "",
    hasPhoto: !!doc.photoUrl,
    /* Keep the raw value too in case any older view depends on it. */
    legacyPhotoUrl: doc.photoUrl,
    bloodType: doc.bloodType,
    qrCodeData: doc.qrCodeData,
    status: doc.status,
    medicalDocumentId: doc.medicalDocumentId,
    medicalStatus: doc.medicalStatus,
    medicalScreenedAt: doc.medicalScreenedAt ? new Date(doc.medicalScreenedAt).toISOString() : null,
    medicalRejectionReason: doc.medicalRejectionReason,
    inductionCompletedAt: doc.inductionCompletedAt ? new Date(doc.inductionCompletedAt).toISOString() : null,
    idCardIssuedAt: doc.idCardIssuedAt ? new Date(doc.idCardIssuedAt).toISOString() : null,
    idCardExpiresAt: doc.idCardExpiresAt ? new Date(doc.idCardExpiresAt).toISOString() : null,
    currentStatus: doc.currentStatus,
    lastScanAt: doc.lastScanAt ? new Date(doc.lastScanAt).toISOString() : null,
  };
}

export type SerializedEmployee = ReturnType<typeof serializeEmployee>;
