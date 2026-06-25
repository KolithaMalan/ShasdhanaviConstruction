"use client";

import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface Props {
  onResult: (text: string) => void;
  paused?: boolean;
}

/**
 * Lightweight webcam QR scanner. Runs only on the client (parent dynamic-
 * imports this module with `ssr: false`). Calls `onResult` once per decode
 * and then ignores further decodes for ~1s to debounce duplicates.
 */
export default function WebcamQrScanner({ onResult, paused }: Props) {
  const containerId = "webcam-qr-target";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastTextRef = useRef<{ text: string; at: number } | null>(null);

  useEffect(() => {
    let mounted = true;
    const scanner = new Html5Qrcode(containerId, { verbose: false });
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 12, qrbox: { width: 260, height: 260 } },
        (decodedText) => {
          if (paused) return;
          const now = Date.now();
          const last = lastTextRef.current;
          if (last && last.text === decodedText && now - last.at < 1500) return;
          lastTextRef.current = { text: decodedText, at: now };
          onResult(decodedText);
        },
        () => { /* ignore per-frame failures */ },
      )
      .catch((err) => {
        console.warn("[webcam-qr] failed to start:", err);
      });

    return () => {
      mounted = false;
      const sc = scannerRef.current;
      if (!sc) return;
      try {
        const stopResult = sc.stop() as unknown;
        if (stopResult && typeof (stopResult as Promise<void>).then === "function") {
          (stopResult as Promise<void>)
            .catch(() => { /* ignore */ })
            .then(() => { try { sc.clear(); } catch { /* ignore */ } });
        } else {
          try { sc.clear(); } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-2xl border border-border/60 bg-black">
      <div id={containerId} className="h-full w-full" />
      <div className="pointer-events-none absolute inset-8 rounded-xl border-2 border-dashed border-white/40" />
    </div>
  );
}
