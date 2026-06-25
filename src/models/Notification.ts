import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { NOTIFICATION_TYPES } from "@/types";

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    link: { type: String, default: "" },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: { type: Schema.Types.Mixed, default: null } as any,
  },
  { timestamps: true, versionKey: false },
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export type NotificationDocument = InferSchemaType<typeof notificationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const NotificationModel: Model<NotificationDocument> =
  (mongoose.models.Notification as Model<NotificationDocument>) ||
  mongoose.model<NotificationDocument>("Notification", notificationSchema);
