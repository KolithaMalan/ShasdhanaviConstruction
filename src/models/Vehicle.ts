import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  VEHICLE_TYPES,
  SITE_PRESENCE,
  VEHICLE_LIFECYCLE_STATUSES,
} from "@/types";

const vehicleSchema = new Schema(
  {
    contractorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    companyName: { type: String, required: true, trim: true },

    vehicleNumber: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
    vehicleType: { type: String, enum: VEHICLE_TYPES, required: true },
    vehicleColour: { type: String, default: "" },
    vehiclePurpose: { type: String, default: "" },
    vehicleMaterials: { type: String, default: "" },

    vehicleQrId: { type: String, required: true, unique: true, index: true },
    qrCodeData: { type: String, required: true },

    status: { type: String, enum: VEHICLE_LIFECYCLE_STATUSES, default: "ACTIVE", index: true },
    currentStatus: { type: String, enum: SITE_PRESENCE, default: "OUT", index: true },
    lastScanAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

export type VehicleDocument = InferSchemaType<typeof vehicleSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const VehicleModel: Model<VehicleDocument> =
  (mongoose.models.Vehicle as Model<VehicleDocument>) ||
  mongoose.model<VehicleDocument>("Vehicle", vehicleSchema);
