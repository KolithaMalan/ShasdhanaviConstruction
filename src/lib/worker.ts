import { customAlphabet } from "nanoid";

import { WorkerModel, type WorkerDocument } from "@/models/Worker";
import { stringifyQr } from "@/lib/qr";
import type { WorkerCompany } from "@/types";

const nano = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 5);

/** WRK-YYYY-XXXXX */
export function generateWorkerId(): string {
  return `WRK-${new Date().getFullYear()}-${nano()}`;
}

export function serializeWorker(doc: WorkerDocument) {
  return {
    id: String(doc._id),
    name: doc.name,
    company: doc.company as WorkerCompany,
    designation: doc.designation,
    department: doc.department,
    nicNumber: doc.nicNumber,
    mobileNumber: doc.mobileNumber ?? "",
    workerId: doc.workerId ?? "",
    qrCodeData: doc.qrCodeData ?? "",
    photoUrl: doc.photoUrl ?? "",
    currentStatus: doc.currentStatus,
    lastScanAt: doc.lastScanAt ? new Date(doc.lastScanAt).toISOString() : null,
    createdByName: doc.createdByName ?? "",
    createdAt: (doc as unknown as { createdAt?: Date }).createdAt?.toISOString() ?? null,
  };
}

export type SerializedWorker = ReturnType<typeof serializeWorker>;

interface CreateInput {
  name: string;
  company: WorkerCompany;
  designation: string;
  department: string;
  nicNumber: string;
  mobileNumber: string;
  createdBy: string;
  createdByName: string;
}

/** Create a worker with a unique worker id + QR payload. */
export async function createWorker(input: CreateInput): Promise<WorkerDocument> {
  let wid = generateWorkerId();
  for (let i = 0; i < 5; i += 1) {
    const collides = await WorkerModel.exists({ workerId: wid });
    if (!collides) break;
    wid = generateWorkerId();
  }

  const qrCodeData = stringifyQr({ type: "WORKER", wid });

  return WorkerModel.create({
    name: input.name,
    company: input.company,
    designation: input.designation,
    department: input.department,
    nicNumber: input.nicNumber,
    mobileNumber: input.mobileNumber,
    workerId: wid,
    qrCodeData,
    createdBy: input.createdBy,
    createdByName: input.createdByName,
  });
}
