import { z } from "zod";
import {
  TRADE_TYPES,
  VEHICLE_TYPES,
  TOOL_UNITS,
  ADDITIONAL_REQUEST_TYPES,
} from "@/types";

/* ─── Auth ─────────────────────────────────── */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
  code: z
    .string()
    .optional()
    .transform((v) => (v ? v.trim() : v)),
});
export type LoginInput = z.infer<typeof loginSchema>;

/* ─── Sri Lankan NIC: 9 digits + V/X (old) or 12 digits (new) ─── */
export const nicSchema = z
  .string()
  .min(1, "NIC is required")
  .regex(
    /^(?:\d{9}[VvXx]|\d{12})$/,
    "NIC must be 9 digits + V/X, or 12 digits",
  );

const phoneSchema = z
  .string()
  .min(7, "Phone number is too short")
  .max(20, "Phone number is too long")
  .regex(/^[+()\-\s\d]+$/, "Phone number contains invalid characters");

/* ─── Step 1 — Company ─────────────────────── */
export const companySchema = z.object({
  companyName: z.string().min(2, "Company name is required").max(160),
  email: z.string().email("Enter a valid email"),
  brNumber: z
    .string()
    .min(3, "BR number is required")
    .max(40),
  officeAddress: z.string().min(5, "Office address is required").max(400),
  contactNumber: phoneSchema,
  poNumber: z.string().min(1, "PO number is required").max(80),
  scopeOfWork: z.string().min(10, "Describe the scope of work").max(2000),
  hasSafetyPlan: z.boolean(),
  hasContractorManagementDocs: z.boolean(),
  safetyPlanDocId: z
    .string()
    .min(1, "Safety Plan upload is required")
    .regex(/^[a-f0-9]{24}$/i, "Invalid document id"),
  cmdDocId: z
    .string()
    .regex(/^[a-f0-9]{24}$/i, "Invalid document id")
    .optional()
    .nullable(),
});
export type CompanyInput = z.infer<typeof companySchema>;

/* ─── Step 2 — Labour ──────────────────────── */
export const labourSchema = z.object({
  name: z.string().min(2, "Name is required").max(120),
  nicNumber: nicSchema,
  address: z.string().min(5, "Address is required").max(300),
  mobileNumber: phoneSchema,
  emergencyContact: phoneSchema,
  tradeType: z.enum(TRADE_TYPES),
  designation: z.string().min(2, "Designation is required").max(80),
  joinedDate: z.coerce.date({ invalid_type_error: "Invalid date" }),
});
export type LabourInput = z.infer<typeof labourSchema>;
export const labourListSchema = z.array(labourSchema);

/* ─── Step 3 — Vehicles ────────────────────── */
export const vehicleSchema = z.object({
  vehicleNumber: z
    .string()
    .min(2, "Vehicle number is required")
    .max(40),
  vehicleType: z.enum(VEHICLE_TYPES),
  vehicleColour: z.string().min(2, "Vehicle colour is required").max(40),
  vehiclePurpose: z.string().min(2, "Purpose is required").max(200),
});
export type VehicleInput = z.infer<typeof vehicleSchema>;
export const vehicleListSchema = z.array(vehicleSchema);

/* ─── Step 4 — Electrical Equipment ───────── */
export const electricalEquipmentSchema = z.object({
  toolName: z.string().min(2, "Tool name is required").max(120),
  category: z.string().min(2, "Category is required").max(80),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  serialNumber: z.string().max(80).optional().default(""),
  powerDetails: z.string().max(120).optional().default(""),
});
export type ElectricalEquipmentInput = z.infer<typeof electricalEquipmentSchema>;
export const electricalEquipmentListSchema = z.array(electricalEquipmentSchema);

/* ─── Step 5 — Non-Electrical Tools ───────── */
export const nonElectricalToolSchema = z.object({
  toolName: z.string().min(2, "Tool name is required").max(120),
  category: z.string().min(2, "Category is required").max(80),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  unit: z.enum(TOOL_UNITS),
});
export type NonElectricalToolInput = z.infer<typeof nonElectricalToolSchema>;
export const nonElectricalToolListSchema = z.array(nonElectricalToolSchema);

/* ─── Full Registration ────────────────────── */
export const registrationSchema = companySchema.extend({
  labourList: labourListSchema.default([]),
  vehicles: vehicleListSchema.default([]),
  electricalEquipment: electricalEquipmentListSchema.default([]),
  nonElectricalTools: nonElectricalToolListSchema.default([]),
});
export type RegistrationInput = z.infer<typeof registrationSchema>;

/* ─── Additional Request ───────────────────── */
export const additionalRequestSchema = z
  .object({
    requestType: z.enum(ADDITIONAL_REQUEST_TYPES),
    labourList: labourListSchema.default([]),
    vehicles: vehicleListSchema.default([]),
    electricalEquipment: electricalEquipmentListSchema.default([]),
    nonElectricalTools: nonElectricalToolListSchema.default([]),
  })
  .refine(
    (v) => {
      switch (v.requestType) {
        case "LABOUR": return v.labourList.length > 0;
        case "VEHICLE": return v.vehicles.length > 0;
        case "ELECTRICAL_EQUIPMENT": return v.electricalEquipment.length > 0;
        case "NON_ELECTRICAL_TOOLS": return v.nonElectricalTools.length > 0;
      }
    },
    { message: "Add at least one item for the selected request type" },
  );
export type AdditionalRequestInput = z.infer<typeof additionalRequestSchema>;

/* ─── Admin review actions ─────────────────── */
export const reviewActionSchema = z.object({
  notes: z.string().max(2000).default(""),
});
export type ReviewActionInput = z.infer<typeof reviewActionSchema>;
