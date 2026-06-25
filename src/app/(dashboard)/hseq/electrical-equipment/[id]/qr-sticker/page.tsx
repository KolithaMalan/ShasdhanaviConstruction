"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileText, Printer, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";

import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { SerializedElectricalEquipment } from "@/lib/tools";

export default function ElectricalQrStickerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [item, setItem] = useState<SerializedElectricalEquipment | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/hseq/electrical/${id}`)
      .then((r) => r.json())
      .then((b) => { setItem(b.item); setQrDataUrl(b.qrDataUrl); })
      .catch(() => { setItem(null); setQrDataUrl(null); });
  }, [id]);

  async function downloadQrSticker() {
    try {
      const res = await fetch(`/api/hseq/electrical/${id}/qr-sticker-pdf`);
      if (!res.ok) throw new Error();
      triggerDownload(await res.blob(), `qr-sticker-${item?.equipmentId ?? id}.pdf`);
      toast.success("QR sticker downloaded");
    } catch { toast.error("Download failed"); }
  }

  async function downloadSafetyPass() {
    try {
      const res = await fetch(`/api/hseq/electrical/${id}/safety-pass-pdf`);
      if (!res.ok) throw new Error();
      triggerDownload(await res.blob(), `safety-pass-${item?.equipmentId ?? id}.pdf`);
      toast.success("Safety pass downloaded");
    } catch { toast.error("Download failed"); }
  }

  async function downloadBoth() {
    await downloadQrSticker();
    await new Promise((r) => setTimeout(r, 250));
    await downloadSafetyPass();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/hseq/electrical-inspection" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to inspection
      </Link>

      <MotionWrapper>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-md">
          {!item ? <Skeleton className="h-16 w-full" /> : (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-500">
                    Passed · {item.equipmentId}
                  </p>
                  <h1 className="font-heading text-2xl font-semibold">{item.toolName}</h1>
                  <p className="text-xs text-muted-foreground">
                    {item.companyName} · valid until {item.nextInspectionDue ? new Date(item.nextInspectionDue).toLocaleDateString("en-GB") : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => window.print()} variant="outline" className="rounded-lg">
                  <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
                <Button onClick={downloadBoth} className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
                  <FileText className="mr-2 h-4 w-4" /> Print Both
                </Button>
              </div>
            </div>
          )}
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-border/60 bg-card/60 p-6 text-center backdrop-blur-md">
            <div className="mb-2 flex items-center justify-center gap-2 text-[--color-brand-ocean]">
              <Zap className="h-4 w-4" />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em]">QR Sticker</span>
            </div>
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="QR" className="mx-auto h-56 w-56 rounded-lg border border-border/60 bg-white p-2" />
            ) : <Skeleton className="mx-auto h-56 w-56 rounded-lg" />}
            <p className="mt-3 font-mono text-[11px] text-muted-foreground">{item?.equipmentId ?? ""}</p>
            <Button onClick={downloadQrSticker} className="mt-4 rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
              <Download className="mr-2 h-4 w-4" /> Download QR Sticker (PDF)
            </Button>
          </article>

          <article className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-6 text-center">
            <div className="mb-2 flex items-center justify-center gap-2 text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em]">Safety Pass</span>
            </div>
            <div className="mx-auto flex h-56 w-56 flex-col items-center justify-center rounded-lg border border-emerald-500/40 bg-white">
              <div className="text-[64px] font-bold leading-none text-emerald-600">✓</div>
              <div className="mt-1 text-2xl font-bold tracking-[0.4em] text-emerald-600">PASSED</div>
              <div className="mt-2 font-mono text-[10px] text-emerald-700/80">{item?.equipmentId ?? ""}</div>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Inspected {item?.inspectedAt ? new Date(item.inspectedAt).toLocaleDateString("en-GB") : "—"}
              {" · "}Next due {item?.nextInspectionDue ? new Date(item.nextInspectionDue).toLocaleDateString("en-GB") : "—"}
            </p>
            <Button onClick={downloadSafetyPass} className="mt-4 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500">
              <Download className="mr-2 h-4 w-4" /> Download Safety Pass (PDF)
            </Button>
          </article>
        </div>
      </MotionWrapper>
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
