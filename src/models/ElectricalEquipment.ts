import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  ELECTRICAL_INSPECTION_STATUSES,
  ELECTRICAL_LIFECYCLE_STATUSES,
} from "@/types";

const electricalEquipmentSchema = new Schema(
  {
    contractorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    companyName: { type: String, required: true, trim: true },

    toolName: { type: String, required: true, trim: true },
    category: { type: String, default: "" },
    quantity: { type: Number, required: true, default: 1, min: 1 },
    serialNumber: { type: String, default: "" },
    powerDetails: { type: String, default: "" },

    /* System-generated */
    equipmentId: { type: String, required: true, unique: true, index: true },
    qrCodeData: { type: String, required: true },

    /* HSEQ electrical inspection */
    inspectionStatus: {
      type: String,
      enum: ELECTRICAL_INSPECTION_STATUSES,
      default: "PENDING_INSPECTION",
      index: true,
    },
    inspectedAt: { type: Date, default: null },
    inspectedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    inspectorName: { type: String, default: "" },
    inspectionNotes: { type: String, default: "" },
    failureReason: { type: String, default: "" },
    nextInspectionDue: { type: Date, default: null },

    /* Inventory tracking */
    status: {
      type: String,
      enum: ELECTRICAL_LIFECYCLE_STATUSES,
      default: "PENDING_INSPECTION",
      index: true,
    },
    currentBalance: { type: Number, required: true, default: 1, min: 0 },
  },
  { timestamps: true, versionKey: false },
);

export type ElectricalEquipmentDocument = InferSchemaType<typeof electricalEquipmentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ElectricalEquipmentModel: Model<ElectricalEquipmentDocument> =
  (mongoose.models.ElectricalEquipment as Model<ElectricalEquipmentDocument>) ||
  mongoose.model<ElectricalEquipmentDocument>("ElectricalEquipment", electricalEquipmentSchema);
