import type { LucideIcon } from "lucide-react";

export const ROLE_VALUES = [
  "SUPER_ADMIN",
  "ADMIN_HSEQ",
  "MEDICAL_OFFICER",
  "HSEQ_OFFICER",
  "SECURITY_OFFICER",
  "INTERNAL_SECURITY",
  "CONTRACTOR",
] as const;

export type Role = (typeof ROLE_VALUES)[number];

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface RoleConfig {
  label: string;
  shortLabel: string;
  dashboardPath: string;
  description: string;
  nav: NavItem[];
}

/* ─── Phase 2 — Registration domain ───────────────────── */

export const REGISTRATION_STATUSES = [
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "CORRECTIONS_REQUESTED",
] as const;

export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const ADDITIONAL_REQUEST_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CORRECTIONS_REQUESTED",
] as const;

export type AdditionalRequestStatus = (typeof ADDITIONAL_REQUEST_STATUSES)[number];

export const TRADE_TYPES = [
  "Project Manager",
  "Project Engineer",
  "Supervisor",
  "Technical Officer",
  "Survey",
  "Assistant Engineer",
  "Electrician",
  "Plumber",
  "Welder",
  "Mason",
  "Carpenter",
  "Painter",
  "Helper",
  "Rigger",
  "Scaffolder",
  "Fitter",
  "Machine Operator",
  "Driver",
  "Safety Officer",
  "Other",
] as const;

export type TradeType = (typeof TRADE_TYPES)[number];

export const VEHICLE_TYPES = [
  "Truck",
  "Lorry",
  "Van",
  "Car",
  "Pickup",
  "Crane",
  "Excavator",
  "Bulldozer",
  "Forklift",
  "Motorcycle",
  "Bus",
  "Other",
] as const;

export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const TOOL_UNITS = [
  "Pieces",
  "Sets",
  "Meters",
  "Kg",
  "Rolls",
  "Boxes",
  "Other",
] as const;

export type ToolUnit = (typeof TOOL_UNITS)[number];

export const ADDITIONAL_REQUEST_TYPES = [
  "LABOUR",
  "VEHICLE",
  "ELECTRICAL_EQUIPMENT",
  "NON_ELECTRICAL_TOOLS",
] as const;

export type AdditionalRequestType = (typeof ADDITIONAL_REQUEST_TYPES)[number];

/* ─── Phase 3 — Employee lifecycle ─────────── */

export const EMPLOYEE_STATUSES = [
  "PENDING_MEDICAL",
  "MEDICAL_PASSED",
  "MEDICAL_REJECTED",
  "INDUCTION_COMPLETED",
  "ACTIVE",
  "DEACTIVATED",
  "BLOCKED",
] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export const MEDICAL_STATUSES = ["PENDING", "PASSED", "FAILED"] as const;
export type MedicalStatus = (typeof MEDICAL_STATUSES)[number];

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"] as const;
export type BloodType = (typeof BLOOD_TYPES)[number];

export const SITE_PRESENCE = ["IN", "OUT"] as const;
export type SitePresence = (typeof SITE_PRESENCE)[number];

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  PENDING_MEDICAL: "Awaiting Medical",
  MEDICAL_PASSED: "Awaiting Induction",
  MEDICAL_REJECTED: "Medically Rejected",
  INDUCTION_COMPLETED: "Induction Complete",
  ACTIVE: "Active",
  DEACTIVATED: "ID Expired",
  BLOCKED: "Blocked",
};

/* ─── Phase 4 — Security gate / movement ─────────── */

export const SCAN_ENTITY_TYPES = ["EMPLOYEE", "VISITOR", "VEHICLE", "PERMANENT"] as const;
export type ScanEntityType = (typeof SCAN_ENTITY_TYPES)[number];

export const SCAN_DIRECTIONS = ["IN", "OUT"] as const;
export type ScanDirection = (typeof SCAN_DIRECTIONS)[number];

export const SCAN_METHODS = ["QR_SCANNER", "WEBCAM", "MANUAL"] as const;
export type ScanMethod = (typeof SCAN_METHODS)[number];

export const VISITOR_STATUSES = ["IN", "OUT", "COMPLETED"] as const;
export type VisitorStatus = (typeof VISITOR_STATUSES)[number];

export const VISITOR_PASS_STATUSES = ["AVAILABLE", "IN_USE"] as const;
export type VisitorPassStatus = (typeof VISITOR_PASS_STATUSES)[number];

export const VEHICLE_LIFECYCLE_STATUSES = ["ACTIVE", "BLOCKED"] as const;
export type VehicleLifecycleStatus = (typeof VEHICLE_LIFECYCLE_STATUSES)[number];

/* QR payload shapes used across the system */
export type EmployeeQrPayload = {
  type: "EMPLOYEE";
  eid: string;
  nic: string;
  cid: string;
};
export type VisitorPassQrPayload = {
  type: "VISITOR_PASS";
  passId: string;
};
export type VehicleQrPayload = {
  type: "VEHICLE";
  vid: string;
  vnum: string;
};
/** Contractor materials gate pass — scanned by security to view the
 *  contractor's full equipment list (electrical + non-electrical). */
export type MaterialsPassQrPayload = {
  type: "MATERIALS_PASS";
  cid: string; // contractor (User) id
};
/** Permanent (staff) employee access pass — no expiry. */
export type PermanentEmployeeQrPayload = {
  type: "PERMANENT_EMPLOYEE";
  pid: string; // permanentId
};
export type AnyQrPayload =
  | EmployeeQrPayload
  | VisitorPassQrPayload
  | VehicleQrPayload
  | ElectricalEquipmentQrPayload
  | MaterialsPassQrPayload
  | PermanentEmployeeQrPayload;

/* ─── Phase 5 — Tools & Equipment management ─────── */

export const ELECTRICAL_INSPECTION_STATUSES = [
  "PENDING_INSPECTION",
  "PASSED",
  "FAILED",
] as const;
export type ElectricalInspectionStatus = (typeof ELECTRICAL_INSPECTION_STATUSES)[number];

export const ELECTRICAL_LIFECYCLE_STATUSES = [
  "PENDING_INSPECTION",
  "APPROVED_INVENTORY",
  "BLOCKED",
  "REMOVED",
] as const;
export type ElectricalLifecycleStatus = (typeof ELECTRICAL_LIFECYCLE_STATUSES)[number];

export const NON_ELECTRICAL_TOOL_STATUSES = ["ACTIVE", "DEPLETED", "BLOCKED"] as const;
export type NonElectricalToolStatus = (typeof NON_ELECTRICAL_TOOL_STATUSES)[number];

export const TOOL_MOVEMENT_TYPES = ["ELECTRICAL", "NON_ELECTRICAL"] as const;
export type ToolMovementType = (typeof TOOL_MOVEMENT_TYPES)[number];

export type ElectricalEquipmentQrPayload = {
  type: "ELECTRICAL_EQUIPMENT";
  eid: string;
};

export const ELECTRICAL_INSPECTION_STATUS_LABELS: Record<ElectricalInspectionStatus, string> = {
  PENDING_INSPECTION: "Pending Inspection",
  PASSED: "Passed",
  FAILED: "Failed",
};

export const ELECTRICAL_LIFECYCLE_LABELS: Record<ElectricalLifecycleStatus, string> = {
  PENDING_INSPECTION: "Awaiting Inspection",
  APPROVED_INVENTORY: "In Inventory",
  BLOCKED: "Blocked",
  REMOVED: "Removed",
};

/* ─── Phase 6 — Photos, Audit, Notifications, Settings ─────── */

export const PHOTO_ENTITY_TYPES = ["EMPLOYEE", "VEHICLE", "EQUIPMENT", "LOGO", "OTHER"] as const;
export type PhotoEntityType = (typeof PHOTO_ENTITY_TYPES)[number];

export const AUDIT_ACTIONS = [
  "LOGIN", "LOGOUT", "CREATE", "UPDATE", "DELETE", "APPROVE", "REJECT",
  "SCAN_IN", "SCAN_OUT", "UPLOAD_PHOTO", "DOWNLOAD_REPORT", "PASSWORD_CHANGE",
  "SETTING_CHANGE", "ACCOUNT_CREATE", "REACTIVATE_ID", "BLOCK_USER", "UNBLOCK_USER",
  "GATE_PASS", "MEDICAL_PASS", "MEDICAL_FAIL", "INSPECTION_PASS", "INSPECTION_FAIL",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const NOTIFICATION_TYPES = [
  "REGISTRATION_SUBMITTED",
  "REGISTRATION_APPROVED",
  "REGISTRATION_REJECTED",
  "CORRECTIONS_REQUESTED",
  "ADDITIONAL_REQUEST_SUBMITTED",
  "ADDITIONAL_REQUEST_APPROVED",
  "ADDITIONAL_REQUEST_REJECTED",
  "ACCOUNT_CREATED",
  "MEDICAL_PASSED",
  "MEDICAL_FAILED",
  "INDUCTION_COMPLETED",
  "ID_EXPIRED",
  "ID_REACTIVATED",
  "EQUIPMENT_INSPECTION_PASSED",
  "EQUIPMENT_INSPECTION_FAILED",
  "GATE_PASS_PROCESSED",
  "SYSTEM_ALERT",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
