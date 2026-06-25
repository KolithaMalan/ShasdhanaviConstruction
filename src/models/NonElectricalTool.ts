import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { TOOL_UNITS, NON_ELECTRICAL_TOOL_STATUSES } from "@/types";

const nonElectricalToolSchema = new Schema(
  {
    contractorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    companyName: { type: String, required: true, trim: true },

    toolName: { type: String, required: true, trim: true },
    category: { type: String, default: "" },
    approvedQuantity: { type: Number, required: true, min: 1 },
    currentBalance: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: TOOL_UNITS, required: true },

    /* System-generated */
    toolId: { type: String, required: true, unique: true, index: true },

    status: {
      type: String,
      enum: NON_ELECTRICAL_TOOL_STATUSES,
      default: "ACTIVE",
      index: true,
    },
    approvalDate: { type: Date, default: () => new Date() },
  },
  { timestamps: true, versionKey: false },
);

export type NonElectricalToolDocument = InferSchemaType<typeof nonElectricalToolSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const NonElectricalToolModel: Model<NonElectricalToolDocument> =
  (mongoose.models.NonElectricalTool as Model<NonElectricalToolDocument>) ||
  mongoose.model<NonElectricalToolDocument>("NonElectricalTool", nonElectricalToolSchema);
