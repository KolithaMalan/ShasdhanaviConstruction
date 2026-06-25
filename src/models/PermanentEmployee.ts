import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const permanentEmployeeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    designation: { type: String, default: "", trim: true },
    department: { type: String, default: "", trim: true },
    nicNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },

    /* System-generated permanent access id + QR */
    permanentId: { type: String, unique: true, index: true },
    qrCodeData: { type: String, default: "" },

    /* Photo — bytes embedded directly on the record (see Employee Phase 7).
       `select: false` keeps list queries lightweight; routes that need the
       image must opt in with .select("+photoData +photoMimeType"). */
    photoUrl: { type: String, default: "" },
    photoData: { type: Buffer, default: null, select: false },
    photoMimeType: { type: String, default: "image/jpeg", select: false },

    /* Gate presence — toggled by Security on each IN/OUT scan */
    currentStatus: { type: String, enum: ["IN", "OUT"], default: "OUT", index: true },
    lastScanAt: { type: Date, default: null },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    createdByName: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false },
);

export type PermanentEmployeeDocument = InferSchemaType<typeof permanentEmployeeSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PermanentEmployeeModel: Model<PermanentEmployeeDocument> =
  (mongoose.models.PermanentEmployee as Model<PermanentEmployeeDocument>) ||
  mongoose.model<PermanentEmployeeDocument>("PermanentEmployee", permanentEmployeeSchema);
