"use client";

import { useState } from "react";
import Image from "next/image";

import type { SerializedEmployee } from "@/lib/employee";

interface Props {
  employee: SerializedEmployee;
  qrDataUrl: string;
}

function initialsFor(name: string): string {
  return (
    name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

/**
 * Renders both faces of the physical ID card at credit-card aspect ratio.
 * Mirrors the PDF output ([IdCardPdf]) — single-side layouts, no terms
 * page, QR moved to the back side.
 */
export function IdCardVisual({ employee, qrDataUrl }: Props) {
  const expiry = employee.idCardExpiresAt
    ? new Date(employee.idCardExpiresAt).toLocaleDateString("en-GB")
    : "—";

  const [photoOk, setPhotoOk] = useState<boolean | null>(null);
  const showPhoto = !!employee.photoUrl && photoOk !== false;

  return (
    <div className="flex flex-col items-center gap-8 print:flex-row print:gap-6">
      {/* ── FRONT ───────────────────────────────────────── */}
      <article className="card-shell">
        <div className="absolute inset-x-0 top-0 h-10 bg-[#19183B]" />
        <div className="absolute inset-x-0 top-10 h-[3px] bg-[#7FC7D9]" />

        <header className="relative flex items-center gap-2 px-4 pt-3 text-white">
          <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded bg-white/15 ring-1 ring-inset ring-white/30">
            <Image src="/Sahas.png" alt="Sahasdhanavi" width={28} height={28} className="h-full w-full object-contain p-0.5" />
          </div>
          <div className="leading-tight">
            <div className="font-mono text-[7px] uppercase tracking-[0.18em] text-white/90">Sahasdhanavi Construction</div>
            <div className="text-[10px] font-semibold">Site Access Pass</div>
          </div>
        </header>

        <div className="relative mt-5 grid grid-cols-[78px_1fr] gap-3 px-4">
          <div className="flex h-[78px] w-[78px] items-center justify-center overflow-hidden rounded-md border border-[#19183B]/20 bg-[#E7F2EF]">
            {showPhoto ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={employee.photoUrl}
                src={employee.photoUrl}
                alt={employee.name}
                className="h-full w-full object-cover"
                onLoad={(e) => {
                  /* The 1×1 fallback gif is 1px wide — treat as "no photo" */
                  const img = e.currentTarget;
                  if (img.naturalWidth > 4 && img.naturalHeight > 4) {
                    setPhotoOk(true);
                  } else {
                    setPhotoOk(false);
                  }
                }}
                onError={() => setPhotoOk(false)}
              />
            ) : (
              <span className="text-2xl font-bold leading-none text-[#19183B]">
                {initialsFor(employee.name)}
              </span>
            )}
          </div>
          <div className="min-w-0 text-[#19183B]">
            <div className="truncate text-[13px] font-bold leading-tight">{employee.name}</div>
            <Row label="Emp ID" value={employee.employeeId ?? "—"} mono />
            <Row label="NIC" value={employee.nicNumber} mono />
            <Row label="Contractor" value={employee.companyName} />
            <Row label="Trade" value={employee.tradeType} />
            <Row label="Designation" value={employee.designation || "—"} />
            <Row label="Blood" value={employee.bloodType || "Unknown"} />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-4 pb-3">
          <div>
            <div className="font-mono text-[7px] uppercase tracking-wider text-[#19183B]/60">Valid Until</div>
            <div className="text-[10px] font-bold text-[#19183B]">{expiry}</div>
          </div>
          <div className="font-mono text-[8px] font-bold tracking-wider text-[#146C94]">
            {employee.employeeId ?? employee.nicNumber}
          </div>
        </div>
      </article>

      {/* ── BACK ────────────────────────────────────────── */}
      <article className="card-shell">
        <div className="absolute inset-x-0 top-0 h-9 bg-[#19183B]" />
        <div className="absolute inset-x-0 top-9 h-[3px] bg-[#7FC7D9]" />

        <header className="relative px-4 pt-2 text-center text-white">
          <div className="font-mono text-[7px] uppercase tracking-[0.18em] text-white/80">
            Scan for Verification
          </div>
          <div className="text-[11px] font-semibold">Site Access QR</div>
        </header>

        <div className="relative flex h-full flex-col items-center justify-center px-4 pb-8 pt-3">
          <div className="rounded-md border border-[#19183B]/20 bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR" className="h-[110px] w-[110px]" />
          </div>
          <div className="mt-2 text-center">
            <div className="font-mono text-[7px] uppercase tracking-[0.18em] text-[#19183B]/60">
              Sahasdhanavi Construction (Pvt) Ltd
            </div>
            <div className="mt-0.5 font-mono text-[8px] font-bold tracking-wider text-[#19183B]">
              {employee.employeeId ?? employee.nicNumber}
            </div>
          </div>
        </div>

        <footer className="absolute inset-x-0 bottom-0 border-t border-[#19183B]/10 bg-[#E7F2EF] px-4 py-1.5">
          <div className="flex items-center justify-between text-[7px] text-[#19183B]/80">
            <span>Property of Sahasdhanavi</span>
            <span className="font-mono">v2 · {new Date().getFullYear()}</span>
          </div>
        </footer>
      </article>

      <style jsx>{`
        .card-shell {
          position: relative;
          width: 340px;
          height: 215px;
          background: #ffffff;
          border-radius: 14px;
          box-shadow:
            0 18px 30px -18px rgba(20, 108, 148, 0.45),
            0 2px 0 rgba(25, 24, 59, 0.04);
          overflow: hidden;
          font-family: var(--font-sans, ui-sans-serif, system-ui);
        }
      `}</style>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="mt-0.5 flex items-baseline gap-1.5 text-[9px]">
      <span className="w-14 shrink-0 font-mono uppercase tracking-wider text-[#19183B]/60">{label}</span>
      <span className={"truncate text-[#19183B] " + (mono ? "font-mono" : "font-medium")}>{value}</span>
    </div>
  );
}
