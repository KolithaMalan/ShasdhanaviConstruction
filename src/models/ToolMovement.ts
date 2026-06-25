import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { SCAN_DIRECTIONS, TOOL_MOVEMENT_TYPES } from "@/types";

const toolMovementSchema = new Schema(
  {
    contractorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    companyName: { type: String, required: true, trim: true },

    toolType: { type: String, enum: TOOL_MOVEMENT_TYPES, required: true, index: true },
    /* refPath polymorphism would be ideal; we keep a generic ObjectId and a
       toolType discriminator instead, since the two collections are queried
       separately. */
    toolId: { type: Schema.Types.ObjectId, required: true, index: true },
    toolName: { type: String, required: true, trim: true },
    toolIdentifier: { type: String, required: true, trim: true, index: true },

    direction: { type: String, enum: SCAN_DIRECTIONS, required: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    balanceBefore: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true, min: 0 },

    gatePassId: { type: String, required: true, trim: true, index: true },

    processedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    processedByName: { type: String, default: "" },
    processedAt: { type: Date, default: () => new Date(), index: true },

    notes: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false },
);

toolMovementSchema.index({ contractorId: 1, processedAt: -1 });
toolMovementSchema.index({ toolId: 1, processedAt: -1 });

export type ToolMovementDocument = InferSchemaType<typeof toolMovementSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ToolMovementModel: Model<ToolMovementDocument> =
  (mongoose.models.ToolMovement as Model<ToolMovementDocument>) ||
  mongoose.model<ToolMovementDocument>("ToolMovement", toolMovementSchema);
