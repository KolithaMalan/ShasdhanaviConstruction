import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const blacklistedNICSchema = new Schema(
  {
    nicNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: { type: String, default: "" },
    reason: { type: String, default: "" },
    blacklistedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    blacklistedAt: { type: Date, default: () => new Date() },
    originalContractorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    originalCompanyName: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type BlacklistedNICDocument =
  InferSchemaType<typeof blacklistedNICSchema> & {
    _id: mongoose.Types.ObjectId;
  };

export const BlacklistedNICModel: Model<BlacklistedNICDocument> =
  (mongoose.models.BlacklistedNIC as Model<BlacklistedNICDocument>) ||
  mongoose.model<BlacklistedNICDocument>("BlacklistedNIC", blacklistedNICSchema);
