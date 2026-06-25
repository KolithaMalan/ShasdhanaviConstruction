import { VisitorPassModel } from "@/models/VisitorPass";
import { stringifyQr } from "@/lib/qr";

/**
 * Pick the next sequential pass id (VP-001, VP-002, …). Reads the
 * highest existing numeric suffix and increments.
 */
export async function nextVisitorPassId(): Promise<string> {
  const last = await VisitorPassModel.findOne({})
    .sort({ passId: -1 })
    .select("passId")
    .lean();
  let next = 1;
  if (last?.passId) {
    const match = /(\d+)$/.exec(last.passId);
    if (match) next = parseInt(match[1]!, 10) + 1;
  }
  return `VP-${String(next).padStart(3, "0")}`;
}

export function buildVisitorPassQr(passId: string): string {
  return stringifyQr({ type: "VISITOR_PASS", passId });
}
