import { customAlphabet } from "nanoid";
import { addMonths } from "date-fns";
import type { ClientSession } from "mongoose";

import {
  ElectricalEquipmentModel,
  type ElectricalEquipmentDocument,
} from "@/models/ElectricalEquipment";
import {
  NonElectricalToolModel,
  type NonElectricalToolDocument,
} from "@/models/NonElectricalTool";
import { stringifyQr } from "@/lib/qr";
import type { ToolUnit } from "@/types";

const nano = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 5);

/** ELEC-YYYY-XXXXX */
export function generateElectricalEquipmentId(): string {
  return `ELEC-${new Date().getFullYear()}-${nano()}`;
}

/** TOOL-YYYY-XXXXX */
export function generateNonElectricalToolId(): string {
  return `TOOL-${new Date().getFullYear()}-${nano()}`;
}

/** Inspection re-due 6 months from `from` */
export function computeNextInspectionDue(from: Date): Date {
  return addMonths(from, 6);
}

interface ElectricalItem {
  toolName: string;
  category?: string;
  quantity: number;
  serialNumber?: string;
  powerDetails?: string;
}

interface NonElectricalItem {
  toolName: string;
  category?: string;
  quantity: number;
  unit: ToolUnit;
}

export interface BulkElectricalOutcome {
  created: number;
  ids: string[];
}
export interface BulkNonElectricalOutcome {
  created: number;
  ids: string[];
}

/** Bulk-create electrical equipment in PENDING_INSPECTION status. */
export async function bulkCreateElectricalEquipment(
  contractorId: string,
  companyName: string,
  items: ElectricalItem[],
): Promise<BulkElectricalOutcome> {
  const outcome: BulkElectricalOutcome = { created: 0, ids: [] };
  if (items.length === 0) return outcome;

  for (const item of items) {
    let eid = generateElectricalEquipmentId();
    for (let i = 0; i < 5; i += 1) {
      const collides = await ElectricalEquipmentModel.exists({ equipmentId: eid });
      if (!collides) break;
      eid = generateElectricalEquipmentId();
    }
    const qrCodeData = stringifyQr({ type: "ELECTRICAL_EQUIPMENT", eid });

    const doc = await ElectricalEquipmentModel.create({
      contractorId,
      companyName,
      toolName: item.toolName,
      category: item.category ?? "",
      quantity: item.quantity,
      serialNumber: item.serialNumber ?? "",
      powerDetails: item.powerDetails ?? "",
      equipmentId: eid,
      qrCodeData,
      inspectionStatus: "PENDING_INSPECTION",
      status: "PENDING_INSPECTION",
      currentBalance: item.quantity,
    });
    outcome.created += 1;
    outcome.ids.push(String(doc._id));
  }
  return outcome;
}

/** Bulk-create non-electrical tools in ACTIVE status. */
export async function bulkCreateNonElectricalTools(
  contractorId: string,
  companyName: string,
  items: NonElectricalItem[],
): Promise<BulkNonElectricalOutcome> {
  const outcome: BulkNonElectricalOutcome = { created: 0, ids: [] };
  if (items.length === 0) return outcome;

  for (const item of items) {
    let tid = generateNonElectricalToolId();
    for (let i = 0; i < 5; i += 1) {
      const collides = await NonElectricalToolModel.exists({ toolId: tid });
      if (!collides) break;
      tid = generateNonElectricalToolId();
    }

    const doc = await NonElectricalToolModel.create({
      contractorId,
      companyName,
      toolName: item.toolName,
      category: item.category ?? "",
      approvedQuantity: item.quantity,
      currentBalance: item.quantity,
      unit: item.unit,
      toolId: tid,
      status: "ACTIVE",
      approvalDate: new Date(),
    });
    outcome.created += 1;
    outcome.ids.push(String(doc._id));
  }
  return outcome;
}

/* ── Serializers ── */

export function serializeElectricalEquipment(doc: ElectricalEquipmentDocument) {
  return {
    id: String(doc._id),
    contractorId: String(doc.contractorId),
    companyName: doc.companyName,
    toolName: doc.toolName,
    category: doc.category,
    quantity: doc.quantity,
    serialNumber: doc.serialNumber,
    powerDetails: doc.powerDetails,
    equipmentId: doc.equipmentId,
    qrCodeData: doc.qrCodeData,
    inspectionStatus: doc.inspectionStatus,
    inspectedAt: doc.inspectedAt ? new Date(doc.inspectedAt).toISOString() : null,
    inspectorName: doc.inspectorName,
    inspectionNotes: doc.inspectionNotes,
    failureReason: doc.failureReason,
    nextInspectionDue: doc.nextInspectionDue ? new Date(doc.nextInspectionDue).toISOString() : null,
    status: doc.status,
    currentBalance: doc.currentBalance,
    createdAt: (doc as unknown as { createdAt?: Date }).createdAt?.toISOString() ?? null,
  };
}

export function serializeNonElectricalTool(doc: NonElectricalToolDocument) {
  return {
    id: String(doc._id),
    contractorId: String(doc.contractorId),
    companyName: doc.companyName,
    toolName: doc.toolName,
    category: doc.category,
    approvedQuantity: doc.approvedQuantity,
    currentBalance: doc.currentBalance,
    unit: doc.unit,
    toolId: doc.toolId,
    status: doc.status,
    approvalDate: doc.approvalDate ? new Date(doc.approvalDate).toISOString() : null,
    createdAt: (doc as unknown as { createdAt?: Date }).createdAt?.toISOString() ?? null,
  };
}

export type SerializedElectricalEquipment = ReturnType<typeof serializeElectricalEquipment>;
export type SerializedNonElectricalTool = ReturnType<typeof serializeNonElectricalTool>;

/**
 * Run an operation inside a Mongoose transaction if the connection
 * supports it (replica set / Atlas). Falls back to non-transactional
 * execution on standalone Mongo dev servers.
 *
 * The callback receives a `session` value (or null when transactions
 * aren't available) so it can be passed to model writes.
 */
export async function withOptionalTransaction<T>(
  fn: (session: ClientSession | null) => Promise<T>,
): Promise<T> {
  const mongoose = (await import("mongoose")).default;
  let session: ClientSession | null = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    try {
      const result = await fn(session);
      await session.commitTransaction();
      return result;
    } catch (err) {
      await session.abortTransaction().catch(() => {});
      throw err;
    }
  } catch (err) {
    // Standalone Mongo: startSession is supported but transactions are not.
    // If we get the specific "transaction numbers" or "Transactions are not"
    // error, fall back to running without a session.
    const message = err instanceof Error ? err.message : String(err);
    if (/transaction/i.test(message) || /replica set/i.test(message)) {
      return fn(null);
    }
    throw err;
  } finally {
    if (session) session.endSession();
  }
}
