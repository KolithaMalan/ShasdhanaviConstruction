import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  ADDITIONAL_REQUEST_STATUSES,
  ADDITIONAL_REQUEST_TYPES,
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

const additionalRequestSchema = new Schema(
  {
    contractorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    companyName: { type: String, required: true, trim: true },
    requestType: {
      type: String,
      enum: ADDITIONAL_REQUEST_TYPES,
      required: true,
      index: true,
    },

    labourList: { type: [labourSchema], default: [] },
    vehicles: { type: [vehicleSchema], default: [] },
    electricalEquipment: { type: [electricalEquipmentSchema], default: [] },
    nonElectricalTools: { type: [nonElectricalToolSchema], default: [] },

    status: {
      type: String,
      enum: ADDITIONAL_REQUEST_STATUSES,
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
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type AdditionalRequestDocument =
  InferSchemaType<typeof additionalRequestSchema> & {
    _id: mongoose.Types.ObjectId;
  };

export const AdditionalRequestModel: Model<AdditionalRequestDocument> =
  (mongoose.models.AdditionalRequest as Model<AdditionalRequestDocument>) ||
  mongoose.model<AdditionalRequestDocument>(
    "AdditionalRequest",
    additionalRequestSchema,
  );
