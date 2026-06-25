import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const DOCUMENT_KINDS = ["SAFETY_PLAN", "CMD"] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

const documentSchema = new Schema(
  {
    kind: { type: String, enum: DOCUMENT_KINDS, required: true, index: true },
    /** Tag the registration this doc belongs to (set after submission). */
    registrationId: {
      type: Schema.Types.ObjectId,
      ref: "ContractorRegistration",
      default: null,
      index: true,
    },
    /** Contractor email captured at upload-time, used to reconcile pre-submission uploads. */
    uploaderEmail: { type: String, default: "", trim: true, lowercase: true, index: true },

    fileName: { type: String, default: "", trim: true },
    mimeType: { type: String, default: "application/octet-stream" },
    fileSize: { type: Number, default: 0 },
    data: { type: Buffer, required: true },

    uploadedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true, versionKey: false },
);

export type DocumentDoc = InferSchemaType<typeof documentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const DocumentModel: Model<DocumentDoc> =
  (mongoose.models.Document as Model<DocumentDoc>) ||
  mongoose.model<DocumentDoc>("Document", documentSchema);
