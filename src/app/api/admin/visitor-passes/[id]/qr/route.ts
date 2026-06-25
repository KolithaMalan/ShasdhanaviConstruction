import mongoose from "mongoose";
import QRCode from "qrcode";

import { connectDB } from "@/lib/db";
import { VisitorPassModel } from "@/models/VisitorPass";
import { requireRole, jsonError } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(["SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  await connectDB();
  const pass = await VisitorPassModel.findById(id).lean();
  if (!pass) return jsonError("Not found", 404);

  const buffer = await QRCode.toBuffer(pass.qrCodeData, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 720,
    color: { dark: "#19183B", light: "#FFFFF0" },
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="visitor-pass-${pass.passId}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
