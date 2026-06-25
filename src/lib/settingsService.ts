import { SystemSettingsModel } from "@/models/SystemSettings";
import { connectDB } from "@/lib/db";

/**
 * Single-document settings store. First read auto-creates the row with
 * sensible defaults so it always returns a value.
 */
export async function getSettings() {
  await connectDB();
  let doc = await SystemSettingsModel.findOne({});
  if (!doc) doc = await SystemSettingsModel.create({});
  return doc;
}

export async function patchSettings(
  patch: Partial<{
    companyName: string;
    companyLogo: string;
    siteName: string;
    idCardValidityMonths: number;
    maxPhotoSizeKb: number;
    defaultGateLocation: string;
    emailNotifications: boolean;
    smtpHost: string;
    smtpPort: number;
    smtpFrom: string;
    maintenanceMode: boolean;
    maintenanceMessage: string;
  }>,
) {
  await connectDB();
  const doc = await SystemSettingsModel.findOneAndUpdate(
    {},
    { $set: patch },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return doc;
}
