import { customAlphabet } from "nanoid";

import {
  PermanentEmployeeModel,
  type PermanentEmployeeDocument,
} from "@/models/PermanentEmployee";
import { stringifyQr } from "@/lib/qr";

const nano = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 5);

/** PERM-YYYY-XXXXX */
export function generatePermanentId(): string {
  return `PERM-${new Date().getFullYear()}-${nano()}`;
}

export function serializePermanentEmployee(doc: PermanentEmployeeDocument) {
  return {
    id: String(doc._id),
    name: doc.name,
    designation: doc.designation,
    department: doc.department,
    nicNumber: doc.nicNumber,
    permanentId: doc.permanentId ?? "",
    qrCodeData: doc.qrCodeData ?? "",
    photoUrl: doc.photoUrl ?? "",
    createdByName: doc.createdByName ?? "",
    createdAt: (doc as unknown as { createdAt?: Date }).createdAt?.toISOString() ?? null,
  };
}

export type SerializedPermanentEmployee = ReturnType<typeof serializePermanentEmployee>;

interface CreateInput {
  name: string;
  designation: string;
  department: string;
  nicNumber: string;
  createdBy: string;
  createdByName: string;
}

/** Create a permanent employee with a unique permanent id + QR payload. */
export async function createPermanentEmployee(
  input: CreateInput,
): Promise<PermanentEmployeeDocument> {
  let pid = generatePermanentId();
  for (let i = 0; i < 5; i += 1) {
    const collides = await PermanentEmployeeModel.exists({ permanentId: pid });
    if (!collides) break;
    pid = generatePermanentId();
  }

  const qrCodeData = stringifyQr({ type: "PERMANENT_EMPLOYEE", pid });

  return PermanentEmployeeModel.create({
    name: input.name,
    designation: input.designation,
    department: input.department,
    nicNumber: input.nicNumber,
    permanentId: pid,
    qrCodeData,
    createdBy: input.createdBy,
    createdByName: input.createdByName,
  });
}
