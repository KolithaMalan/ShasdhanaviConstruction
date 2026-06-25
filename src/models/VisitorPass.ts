import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { VISITOR_PASS_STATUSES } from "@/types";

const visitorPassSchema = new Schema(
  {
    passId: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
    qrCodeData: { type: String, required: true },
    currentStatus: { type: String, enum: VISITOR_PASS_STATUSES, default: "AVAILABLE", index: true },
    currentVisitorId: { type: Schema.Types.ObjectId, ref: "Visitor", default: null },
  },
  { timestamps: true, versionKey: false },
);

export type VisitorPassDocument = InferSchemaType<typeof visitorPassSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const VisitorPassModel: Model<VisitorPassDocument> =
  (mongoose.models.VisitorPass as Model<VisitorPassDocument>) ||
  mongoose.model<VisitorPassDocument>("VisitorPass", visitorPassSchema);
