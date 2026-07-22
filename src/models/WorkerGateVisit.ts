import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Item/tool tracking for a Yugadhanavi/Sobadhanavi worker's site visit.
 *
 * At morning IN the security officer records the items the worker brings in.
 * The record stays OPEN through the day (workers may leave/return at lunch) so
 * on every OUT scan the officer sees the recorded items to verify what's
 * leaving matches what came in. At final departure the officer either CLEARs
 * (deletes) or KEEPs (archives → CLOSED) the record. Attendance (MovementLog)
 * is written independently and is never affected by clearing items.
 */
const workerGateVisitSchema = new Schema(
  {
    workerId: { type: Schema.Types.ObjectId, ref: "Worker", required: true, index: true },
    workerName: { type: String, required: true, trim: true },
    workerCode: { type: String, default: "" }, // WRK-YYYY-XXXXX snapshot
    company: { type: String, default: "" },

    /* Items brought IN in the morning */
    items: { type: [{ name: { type: String, trim: true } }], default: [] },
    /* Items verified as taken OUT at departure (officer-edited copy) */
    itemsOutVerified: { type: [{ name: { type: String, trim: true } }], default: [] },

    status: { type: String, enum: ["OPEN", "CLOSED"], default: "OPEN", index: true },
    checkInAt: { type: Date, default: () => new Date() },
    checkOutAt: { type: Date, default: null },

    gateLocation: { type: String, default: "Main Gate" },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    recordedByName: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false },
);

workerGateVisitSchema.index({ workerId: 1, status: 1 });

export type WorkerGateVisitDocument = InferSchemaType<typeof workerGateVisitSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const WorkerGateVisitModel: Model<WorkerGateVisitDocument> =
  (mongoose.models.WorkerGateVisit as Model<WorkerGateVisitDocument>) ||
  mongoose.model<WorkerGateVisitDocument>("WorkerGateVisit", workerGateVisitSchema);
