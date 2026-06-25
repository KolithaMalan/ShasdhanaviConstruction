import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";

import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import { ToolMovementModel } from "@/models/ToolMovement";
import { ToolMovementReportPdf } from "@/components/pdf/ToolMovementReportPdf";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["CONTRACTOR"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const startParam = searchParams.get("startDate");
  const endParam = searchParams.get("endDate");

  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const start = startParam ? new Date(startParam) : defaultStart;
  const end = endParam ? new Date(endParam) : now;
  end.setHours(23, 59, 59, 999);

  await connectDB();
  const user = await UserModel.findById(guard.session.user.id).lean();
  const companyName = user?.companyName ?? user?.name ?? "Contractor";

  const docs = await ToolMovementModel.find({
    contractorId: guard.session.user.id,
    processedAt: { $gte: start, $lte: end },
  }).sort({ processedAt: -1 }).limit(2000).lean();

  const rows = docs.map((d) => {
    const dt = new Date(d.processedAt);
    return {
      date: dt.toLocaleDateString("en-GB"),
      time: dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      direction: d.direction as "IN" | "OUT",
      toolType: d.toolType as "ELECTRICAL" | "NON_ELECTRICAL",
      toolName: d.toolName,
      toolIdentifier: d.toolIdentifier,
      quantity: d.quantity,
      balanceBefore: d.balanceBefore,
      balanceAfter: d.balanceAfter,
      gatePassId: d.gatePassId,
      officer: d.processedByName,
      notes: d.notes,
    };
  });

  const element = React.createElement(ToolMovementReportPdf, {
    companyName,
    startDate: start.toLocaleDateString("en-GB"),
    endDate: end.toLocaleDateString("en-GB"),
    generatedAt: now.toLocaleString("en-GB"),
    rows,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  const filename = `tool-movements-${companyName.replace(/\s+/g, "-").toLowerCase()}-${now.toISOString().slice(0, 10)}.pdf`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
