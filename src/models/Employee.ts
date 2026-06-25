import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  EMPLOYEE_STATUSES,
  MEDICAL_STATUSES,
  BLOOD_TYPES,
  SITE_PRESENCE,
  TRADE_TYPES,
} from "@/types";

const employeeSchema = new Schema(
  {
    contractorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    companyName: { type: String, required: true, trim: true },

    /* Identity (from contractor submission) */
    name: { type: String, required: true, trim: true },
    nicNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    address: { type: String, default: "" },
    mobileNumber: { type: String, default: "" },
    emergencyContact: { type: String, default: "" },
    tradeType: { type: String, enum: TRADE_TYPES, required: true },
    designation: { type: String, default: "" },
    joinedDate: { type: Date, required: true },

    /* System-generated after induction */
    employeeId: { type: String, unique: true, sparse: true, index: true },
    photoUrl: { type: String, default: "" },
    bloodType: { type: String, enum: BLOOD_TYPES, default: "Unknown" },
    qrCodeData: { type: String, default: "" },

    /* Phase 7 — store the photo bytes directly on the employee record.
       Marked `select: false` so list queries don't pull megabytes of
       Buffer data; routes that need the photo must opt in with
       .select("+photoData +photoMimeType"). */
    photoData: { type: Buffer, default: null, select: false },
    photoMimeType: { type: String, default: "image/jpeg", select: false },

    /* Lifecycle status */
    status: {
      type: String,
      enum: EMPLOYEE_STATUSES,
      default: "PENDING_MEDICAL",
      index: true,
    },

    /* Medical */
    medicalDocumentId: { type: String, default: "" },
    medicalStatus: {
      type: String,
      enum: MEDICAL_STATUSES,
      default: "PENDING",
    },
    medicalScreenedAt: { type: Date, default: null },
    medicalScreenedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    medicalRejectionReason: { type: String, default: "" },

    /* Induction */
    inductionCompletedAt: { type: Date, default: null },
    inductionCompletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* ID Card validity */
    idCardIssuedAt: { type: Date, default: null },
    idCardExpiresAt: { type: Date, default: null },
    idCardActivatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* Current presence (Phase 4 will write to this) */
    currentStatus: {
      type: String,
      enum: SITE_PRESENCE,
      default: "OUT",
      index: true,
    },
    lastScanAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type EmployeeDocument = InferSchemaType<typeof employeeSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const EmployeeModel: Model<EmployeeDocument> =
  (mongoose.models.Employee as Model<EmployeeDocument>) ||
  mongoose.model<EmployeeDocument>("Employee", employeeSchema);
