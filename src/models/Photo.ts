import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { PHOTO_ENTITY_TYPES } from "@/types";

const photoSchema = new Schema(
  {
    entityType: { type: String, enum: PHOTO_ENTITY_TYPES, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    referenceId: { type: Schema.Types.ObjectId, default: null, index: true },

    fileName: { type: String, default: "" },
    mimeType: { type: String, default: "image/jpeg" },
    fileSize: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },

    data: { type: Buffer, required: true },
    thumbnail: { type: Buffer, default: null },
    thumbnailMimeType: { type: String, default: "image/jpeg" },

    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    uploadedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true, versionKey: false },
);

photoSchema.index({ entityType: 1, entityId: 1 }, { unique: true });

export type PhotoDocument = InferSchemaType<typeof photoSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PhotoModel: Model<PhotoDocument> =
  (mongoose.models.Photo as Model<PhotoDocument>) ||
  mongoose.model<PhotoDocument>("Photo", photoSchema);
