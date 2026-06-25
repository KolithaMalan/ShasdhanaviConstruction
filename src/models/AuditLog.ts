import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { AUDIT_ACTIONS } from "@/types";

const auditLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userName: { type: String, default: "" },
    userEmail: { type: String, default: "" },
    userRole: { type: String, default: "" },

    action: { type: String, enum: AUDIT_ACTIONS, required: true, index: true },
    entityType: { type: String, default: "", index: true },
    entityId: { type: String, default: "" },
    description: { type: String, default: "" },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: { type: Schema.Types.Mixed, default: null } as any,
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AuditLogModel: Model<AuditLogDocument> =
  (mongoose.models.AuditLog as Model<AuditLogDocument>) ||
  mongoose.model<AuditLogDocument>("AuditLog", auditLogSchema);
