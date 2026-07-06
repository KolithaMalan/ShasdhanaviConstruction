import { customAlphabet } from "nanoid";

import { VehicleModel, type VehicleDocument } from "@/models/Vehicle";
import { stringifyQr } from "@/lib/qr";
import type { VehicleType } from "@/types";

const nano = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 5);

/** VEH-YYYY-XXXXX */
export function generateVehicleQrId(): string {
  return `VEH-${new Date().getFullYear()}-${nano()}`;
}

interface VehicleInput {
  vehicleNumber: string;
  vehicleType: VehicleType;
  vehicleColour?: string;
  vehiclePurpose?: string;
  vehicleMaterials?: string;
}

export interface BulkVehicleOutcome {
  created: number;
  skipped: { vehicleNumber: string; reason: string }[];
}

/** Idempotent bulk-create — skips vehicles whose number already exists. */
export async function bulkCreateVehicles(
  contractorId: string,
  companyName: string,
  vehicles: VehicleInput[],
): Promise<BulkVehicleOutcome> {
  const outcome: BulkVehicleOutcome = { created: 0, skipped: [] };
  if (vehicles.length === 0) return outcome;

  const numbers = vehicles.map((v) => v.vehicleNumber.trim().toUpperCase());
  const existing = await VehicleModel.find({ vehicleNumber: { $in: numbers } })
    .select("vehicleNumber")
    .lean();
  const existingSet = new Set(existing.map((e) => e.vehicleNumber));

  for (const v of vehicles) {
    const num = v.vehicleNumber.trim().toUpperCase();
    if (existingSet.has(num)) {
      outcome.skipped.push({ vehicleNumber: num, reason: "Already registered" });
      continue;
    }

    let vid = generateVehicleQrId();
    for (let i = 0; i < 5; i += 1) {
      const collides = await VehicleModel.exists({ vehicleQrId: vid });
      if (!collides) break;
      vid = generateVehicleQrId();
    }
    const qrCodeData = stringifyQr({
      type: "VEHICLE",
      vid,
      vnum: num,
    });

    await VehicleModel.create({
      contractorId,
      companyName,
      vehicleNumber: num,
      vehicleType: v.vehicleType,
      vehicleColour: v.vehicleColour ?? "",
      vehiclePurpose: v.vehiclePurpose ?? "",
      vehicleMaterials: v.vehicleMaterials ?? "",
      vehicleQrId: vid,
      qrCodeData,
      status: "ACTIVE",
      currentStatus: "OUT",
    });
    outcome.created += 1;
  }
  return outcome;
}

export function serializeVehicle(doc: VehicleDocument) {
  return {
    id: String(doc._id),
    contractorId: String(doc.contractorId),
    companyName: doc.companyName,
    vehicleNumber: doc.vehicleNumber,
    vehicleType: doc.vehicleType,
    vehicleColour: doc.vehicleColour,
    vehiclePurpose: doc.vehiclePurpose,
    vehicleMaterials: (doc as unknown as { vehicleMaterials?: string }).vehicleMaterials ?? "",
    vehicleQrId: doc.vehicleQrId,
    qrCodeData: doc.qrCodeData,
    status: doc.status,
    currentStatus: doc.currentStatus,
    lastScanAt: doc.lastScanAt ? new Date(doc.lastScanAt).toISOString() : null,
    createdAt: (doc as unknown as { createdAt?: Date }).createdAt?.toISOString() ?? null,
  };
}

export type SerializedVehicle = ReturnType<typeof serializeVehicle>;
