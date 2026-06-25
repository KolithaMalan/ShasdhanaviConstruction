import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { SCAN_ENTITY_TYPES, SCAN_DIRECTIONS, SCAN_METHODS } from "@/types";

const movementLogSchema = new Schema(
  {
    entityType: { type: String, enum: SCAN_ENTITY_TYPES, required: true, index: true },

    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", default: null, index: true },
    visitorId:  { type: Schema.Types.ObjectId, ref: "Visitor",  default: null, index: true },
    vehicleId:  { type: Schema.Types.ObjectId, ref: "Vehicle",  default: null, index: true },
    permanentEmployeeId: { type: Schema.Types.ObjectId, ref: "PermanentEmployee", default: null, index: true },

    /* Snapshots — avoid expensive joins on hot read paths */
    entityName: { type: String, required: true, trim: true },
    entityIdentifier: { type: String, required: true, trim: true, index: true },
    contractorId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    companyName: { type: String, default: "" },

    direction: { type: String, enum: SCAN_DIRECTIONS, required: true, index: true },
    scannedAt: { type: Date, default: () => new Date(), index: true },
    gateLocation: { type: String, default: "Main Gate" },
    scannedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    scannedByName: { type: String, default: "" },
    scanMethod: { type: String, enum: SCAN_METHODS, default: "QR_SCANNER" },

    notes: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false },
);

// Hot compound indexes for the dashboards + contractor history queries
movementLogSchema.index({ entityType: 1, scannedAt: -1 });
movementLogSchema.index({ employeeId: 1, scannedAt: -1 });
movementLogSchema.index({ vehicleId: 1, scannedAt: -1 });
movementLogSchema.index({ contractorId: 1, scannedAt: -1 });

export type MovementLogDocument = InferSchemaType<typeof movementLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const MovementLogModel: Model<MovementLogDocument> =
  (mongoose.models.MovementLog as Model<MovementLogDocument>) ||
  mongoose.model<MovementLogDocument>("MovementLog", movementLogSchema);
