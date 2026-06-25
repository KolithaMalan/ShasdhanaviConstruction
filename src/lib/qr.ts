import QRCode from "qrcode";
import type { AnyQrPayload, EmployeeQrPayload } from "@/types";

/** Legacy alias — kept for existing Phase 3 callers. */
export type QrPayload = Omit<EmployeeQrPayload, "type">;

/** Always stamps `type: "EMPLOYEE"` so the security scanner can route correctly. */
export function makeQrPayload(p: QrPayload): string {
  const payload: EmployeeQrPayload = { type: "EMPLOYEE", ...p };
  return JSON.stringify(payload);
}

/** Generic stringifier for any typed QR payload (visitor pass / vehicle). */
export function stringifyQr(payload: AnyQrPayload): string {
  return JSON.stringify(payload);
}

/** Best-effort parse — returns null when the string is not a recognised payload. */
export function parseQr(raw: string): AnyQrPayload | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as Partial<AnyQrPayload>;
    if (!parsed || typeof parsed !== "object" || !("type" in parsed)) return null;
    switch (parsed.type) {
      case "EMPLOYEE":
        if (typeof parsed.eid === "string" && typeof parsed.nic === "string") {
          return parsed as AnyQrPayload;
        }
        return null;
      case "VISITOR_PASS":
        if (typeof parsed.passId === "string") return parsed as AnyQrPayload;
        return null;
      case "VEHICLE":
        if (typeof parsed.vid === "string") return parsed as AnyQrPayload;
        return null;
      case "MATERIALS_PASS":
        if (typeof parsed.cid === "string") return parsed as AnyQrPayload;
        return null;
      case "PERMANENT_EMPLOYEE":
        if (typeof parsed.pid === "string") return parsed as AnyQrPayload;
        return null;
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/** PNG data URL — works directly as <img src> or <Image src> in react-pdf. */
export async function qrPngDataUrl(payload: string, sizePx = 320): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: sizePx,
    color: { dark: "#19183B", light: "#FFFFF0" },
  });
}

/** Raw PNG buffer — for download endpoints and ZIP entries. */
export async function qrPngBuffer(payload: string, sizePx = 512): Promise<Buffer> {
  return QRCode.toBuffer(payload, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: sizePx,
    color: { dark: "#19183B", light: "#FFFFF0" },
  });
}
