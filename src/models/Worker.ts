import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { WORKER_COMPANIES } from "@/types";

/**
 * Yugadhanavi / Sobadhanavi worker. Independent from PermanentEmployee, but
 * mirrors its shape: system-generated worker id + QR used for gate attendance
 * and item tracking.
 */
const workerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    company: { type: String, enum: WORKER_COMPANIES, required: true, index: true },
    designation: { type: String, default: "", trim: true },
    department: { type: String, default: "", trim: true },
    nicNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    mobileNumber: { type: String, default: "", trim: true },

    /* System-generated worker access id + QR */
    workerId: { type: String, unique: true, index: true },
    qrCodeData: { type: String, default: "" },

    /* Photo — bytes embedded on the record (see PermanentEmployee for pattern).
       `select: false` keeps list queries lightweight. */
    photoUrl: { type: String, default: "" },
    photoData: { type: Buffer, default: null, select: false },
    photoMimeType: { type: String, default: "image/jpeg", select: false },

    /* Gate presence — toggled on each IN/OUT scan */
    currentStatus: { type: String, enum: ["IN", "OUT"], default: "OUT", index: true },
    lastScanAt: { type: Date, default: null },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    createdByName: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false },
);

export type WorkerDocument = InferSchemaType<typeof workerSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const WorkerModel: Model<WorkerDocument> =
  (mongoose.models.Worker as Model<WorkerDocument>) ||
  mongoose.model<WorkerDocument>("Worker", workerSchema);
