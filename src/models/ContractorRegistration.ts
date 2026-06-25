import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  REGISTRATION_STATUSES,
  TRADE_TYPES,
  VEHICLE_TYPES,
  TOOL_UNITS,
} from "@/types";

const labourSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    nicNumber: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    emergencyContact: { type: String, required: true, trim: true },
    tradeType: { type: String, enum: TRADE_TYPES, required: true },
    designation: { type: String, required: true, trim: true },
    joinedDate: { type: Date, required: true },
  },
  { _id: true },
);

const vehicleSchema = new Schema(
  {
    vehicleNumber: { type: String, required: true, trim: true },
    vehicleType: { type: String, enum: VEHICLE_TYPES, required: true },
    vehicleColour: { type: String, required: true, trim: true },
    vehiclePurpose: { type: String, required: true, trim: true },
  },
  { _id: true },
);

const electricalEquipmentSchema = new Schema(
  {
    toolName: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    serialNumber: { type: String, trim: true, default: "" },
    powerDetails: { type: String, trim: true, default: "" },
  },
  { _id: true },
);

const nonElectricalToolSchema = new Schema(
  {
    toolName: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, enum: TOOL_UNITS, required: true },
  },
  { _id: true },
);

const contractorRegistrationSchema = new Schema(
  {
    /* Step 1 — Company */
    companyName: { type: String, required: true, trim: true, index: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    brNumber: { type: String, required: true, trim: true },
    officeAddress: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    poNumber: { type: String, required: true, trim: true },
    scopeOfWork: { type: String, required: true, trim: true },
    hasSafetyPlan: { type: Boolean, default: false },
    hasContractorManagementDocs: { type: Boolean, default: false },
    safetyPlanDocId: { type: Schema.Types.ObjectId, ref: "Document", default: null },
    cmdDocId: { type: Schema.Types.ObjectId, ref: "Document", default: null },

    /* Step 2-5 — embedded arrays */
    labourList: { type: [labourSchema], default: [] },
    vehicles: { type: [vehicleSchema], default: [] },
    electricalEquipment: { type: [electricalEquipmentSchema], default: [] },
    nonElectricalTools: { type: [nonElectricalToolSchema], default: [] },

    /* System */
    status: {
      type: String,
      enum: REGISTRATION_STATUSES,
      default: "PENDING",
      index: true,
    },
    adminNotes: { type: String, default: "" },
    submittedAt: { type: Date, default: () => new Date() },
    reviewedAt: { type: Date, default: null },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    contractorAccountCreated: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type ContractorRegistrationDocument =
  InferSchemaType<typeof contractorRegistrationSchema> & {
    _id: mongoose.Types.ObjectId;
  };

export const ContractorRegistrationModel: Model<ContractorRegistrationDocument> =
  (mongoose.models.ContractorRegistration as Model<ContractorRegistrationDocument>) ||
  mongoose.model<ContractorRegistrationDocument>(
    "ContractorRegistration",
    contractorRegistrationSchema,
  );
