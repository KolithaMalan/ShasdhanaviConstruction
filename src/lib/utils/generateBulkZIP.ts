import { ZipArchive } from "archiver";
import { PassThrough } from "node:stream";

import type { EmployeeDocument } from "@/models/Employee";
import { generateQRCode } from "@/lib/utils/generateQRCode";

/**
 * Stream a ZIP archive of employee QR PNGs.
 *
 * Files are organised as `{Contractor}/qr-{employeeId}-{name}.png` so that
 * unpacking yields a tidy per-contractor folder structure.
 */
export function generateBulkZIP(employees: EmployeeDocument[]): PassThrough {
  const stream = new PassThrough();
  const archive = new ZipArchive({ zlib: { level: 9 } });

  archive.on("warning", (err) => console.warn("[bulk-zip] warning:", err));
  archive.on("error", (err) => {
    console.error("[bulk-zip] error:", err);
    stream.destroy(err);
  });
  archive.pipe(stream);

  /* Append entries asynchronously, then finalize. */
  (async () => {
    for (const r of employees) {
      if (!r.qrCodeData) continue;
      try {
        const buf = await generateQRCode(r.qrCodeData, 512);
        const safeCompany = r.companyName.replace(/[^A-Za-z0-9._-]+/g, "_");
        const safeName = r.name.replace(/[^A-Za-z0-9._-]+/g, "_");
        const fileName = `qr-${r.employeeId ?? r.nicNumber}-${safeName}.png`;
        archive.append(buf, { name: `${safeCompany}/${fileName}` });
      } catch (err) {
        console.warn(`[bulk-zip] skipped ${r.nicNumber}:`, err);
      }
    }
    /* archiver v8 returns a promise here — await so failures hit the catch. */
    await archive.finalize();
  })().catch((err) => {
    console.error("[bulk-zip] fatal:", err);
    stream.destroy(err as Error);
  });

  return stream;
}
