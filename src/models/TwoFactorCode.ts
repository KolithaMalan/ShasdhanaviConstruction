import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const twoFactorCodeSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    consumed: { type: Boolean, default: false },
    lastSentAt: { type: Date, default: () => new Date() },
    /** Set when too many failed attempts trigger a lockout window. */
    lockedUntil: { type: Date, default: null, index: true },
  },
  { timestamps: true, versionKey: false },
);

// TTL — Mongo will purge docs when their expiresAt passes.
twoFactorCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type TwoFactorCodeDocument = InferSchemaType<typeof twoFactorCodeSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const TwoFactorCodeModel: Model<TwoFactorCodeDocument> =
  (mongoose.models.TwoFactorCode as Model<TwoFactorCodeDocument>) ||
  mongoose.model<TwoFactorCodeDocument>("TwoFactorCode", twoFactorCodeSchema);
