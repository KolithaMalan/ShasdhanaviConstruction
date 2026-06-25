import { qrPngBuffer } from "@/lib/qr";

/** Re-export thin wrapper so all download helpers share one entry point. */
export async function generateQRCode(payload: string, sizePx = 512): Promise<Buffer> {
  return qrPngBuffer(payload, sizePx);
}
