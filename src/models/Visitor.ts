import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { VISITOR_STATUSES } from "@/types";

const visitorSchema = new Schema(
  {
    visitorPassId: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    nicNumber: { type: String, required: true, trim: true, uppercase: true, index: true },
    company: { type: String, default: "" },
    purpose: { type: String, default: "" },
    contactPerson: { type: String, default: "" },

    currentStatus: { type: String, enum: VISITOR_STATUSES, default: "IN", index: true },
    enteredAt: { type: Date, required: true, default: () => new Date() },
    exitedAt: { type: Date, default: null },
    enteredBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    exitedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, versionKey: false },
);

export type VisitorDocument = InferSchemaType<typeof visitorSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const VisitorModel: Model<VisitorDocument> =
  (mongoose.models.Visitor as Model<VisitorDocument>) ||
  mongoose.model<VisitorDocument>("Visitor", visitorSchema);
