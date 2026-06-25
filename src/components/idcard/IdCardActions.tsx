"use client";

import { Download, Printer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function IdCardActions({ employeeId }: { employeeId: string }) {
  async function downloadPdf() {
    try {
      const res = await fetch(`/api/hseq/id-card/${employeeId}/pdf`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `id-card-${employeeId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("ID card PDF downloaded");
    } catch {
      toast.error("Failed to download PDF");
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-border/60 bg-card/80 p-3 backdrop-blur-xl print:hidden">
      <Button variant="outline" onClick={() => window.print()} className="rounded-lg">
        <Printer className="mr-2 h-4 w-4" /> Print
      </Button>
      <Button onClick={downloadPdf} className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
        <Download className="mr-2 h-4 w-4" /> Download PDF
      </Button>
    </div>
  );
}
