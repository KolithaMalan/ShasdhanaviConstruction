import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

import { ROLE_VALUES } from "@/types";

/**
 * Per-role feature switches, one document per role.
 *
 * Only *disabled* keys are stored, so any feature added later is automatically
 * on for everyone until a Super Admin turns it off.
 */
const roleFeatureSchema = new Schema(
  {
    role: { type: String, enum: ROLE_VALUES, required: true, unique: true, index: true },
    disabled: { type: [String], default: [] },
    updatedByName: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false },
);

export type RoleFeatureDocument = InferSchemaType<typeof roleFeatureSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const RoleFeatureModel: Model<RoleFeatureDocument> =
  (mongoose.models.RoleFeature as Model<RoleFeatureDocument>) ||
  mongoose.model<RoleFeatureDocument>("RoleFeature", roleFeatureSchema);
