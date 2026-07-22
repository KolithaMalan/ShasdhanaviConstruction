import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Item/tool tracking for a Yugadhanavi/Sobadhanavi worker's site visit.
 *
 * At morning IN the security officer records the items the worker brings in.
 * The record stays OPEN through the day (workers may leave/return at lunch) so
 * on every OUT scan the officer sees the recorded items to verify what's
 * leaving matches what came in. A worker returning from lunch may bring extra
 * items — those are appended to the same OPEN record rather than replacing it,
 * so the OUT check always covers everything currently on site with them.
 * At final departure the record is closed (archived → CLOSED). Attendance
 * (MovementLog) is written independently and never affected by item tracking.
 */
const workerGateVisitSchema = new Schema(
  {
    workerId: { type: Schema.Types.ObjectId, ref: "Worker", required: true, index: true },
    workerName: { type: String, required: true, trim: true },
    workerCode: { type: String, default: "" }, // WRK-YYYY-XXXXX snapshot
    company: { type: String, default: "" },

    /* Items brought IN. `addedAt` distinguishes the morning items from ones
       added on a later re-entry (e.g. back from lunch with a new tool). */
    items: {
      type: [{ name: { type: String, trim: true }, addedAt: { type: Date, default: () => new Date() } }],
      default: [],
    },
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
