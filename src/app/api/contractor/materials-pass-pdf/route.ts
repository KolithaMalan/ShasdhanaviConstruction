import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";

import { connectDB } from "@/lib/db";
import { requireRole } from "@/lib/api";
import { loadContractorMaterials } from "@/lib/materialsPass";
import { stringifyQr, qrPngDataUrl } from "@/lib/qr";
import { getSahasLogoDataUrl } from "@/lib/brandAssets";
import { MaterialsRecordPdf } from "@/components/pdf/MaterialsRecordPdf";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireRole(["CONTRACTOR", "SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  const contractorId = guard.session.user.id;

  await connectDB();
  const { companyName, items } = await loadContractorMaterials(contractorId);

  const qrPayload = stringifyQr({ type: "MATERIALS_PASS", cid: contractorId });
  const [qrDataUrl, logoDataUrl] = await Promise.all([
    qrPngDataUrl(qrPayload, 320),
    getSahasLogoDataUrl(),
  ]);

  const downloadDate = new Date().toISOString().slice(0, 10);

  const element = React.createElement(MaterialsRecordPdf, {
    companyName,
    downloadDate,
    items,
    qrDataUrl,
    logoDataUrl,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="materials-in-out-${downloadDate}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
