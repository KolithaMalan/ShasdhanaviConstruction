import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { ROLES } from "@/config/roles";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ROLES,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    /** Timestamp of the first successful contractor first-time verification. */
    verifiedAt: {
      type: Date,
      default: null,
    },

    /* ─── Contractor-specific (Phase 2) ─── */
    companyName: { type: String, trim: true, default: null },
    brNumber: { type: String, trim: true, default: null },
    registrationId: {
      type: Schema.Types.ObjectId,
      ref: "ContractorRegistration",
      default: null,
      index: true,
    },
    mustChangePassword: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const UserModel: Model<UserDocument> =
  (mongoose.models.User as Model<UserDocument>) ||
  mongoose.model<UserDocument>("User", userSchema);
