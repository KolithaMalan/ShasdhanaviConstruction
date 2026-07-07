import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const systemSettingsSchema = new Schema(
  {
    companyName: { type: String, default: "Sahasdhanavi Construction" },
    companyLogo: { type: String, default: "" },
    siteName: { type: String, default: "Power Plant Construction Site" },

    idCardValidityMonths: { type: Number, default: 2, min: 1, max: 60 },
    maxPhotoSizeKb: { type: Number, default: 500, min: 50, max: 5000 },
    defaultGateLocation: { type: String, default: "Main Gate" },

    emailNotifications: { type: Boolean, default: true },
    smtpHost: { type: String, default: "" },
    smtpPort: { type: Number, default: 587 },
    smtpFrom: { type: String, default: "" },

    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false },
);

export type SystemSettingsDocument = InferSchemaType<typeof systemSettingsSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SystemSettingsModel: Model<SystemSettingsDocument> =
  (mongoose.models.SystemSettings as Model<SystemSettingsDocument>) ||
  mongoose.model<SystemSettingsDocument>("SystemSettings", systemSettingsSchema);
