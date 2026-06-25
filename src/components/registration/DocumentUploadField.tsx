"use client";

import { useRef, useState } from "react";
import { CheckCircle2, FileText, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Kind = "SAFETY_PLAN" | "CMD";

interface Props {
  kind: Kind;
  label: string;
  description: string;
  required?: boolean;
  documentId: string | null;
  uploaderEmail?: string;
  onUploaded: (documentId: string, meta: { fileName: string; fileSize: number }) => void;
  onCleared: () => void;
  error?: string;
}

const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx";

export function DocumentUploadField({
  kind, label, description, required, documentId,
  uploaderEmail, onUploaded, onCleared, error,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);

  async function upload(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large", { description: "Maximum size is 10 MB." });
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);
      if (uploaderEmail) fd.append("uploaderEmail", uploaderEmail);
      const res = await fetch("/api/public/upload-document", { method: "POST", body: fd });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error("Upload failed", { description: body.message ?? "Try again." });
        return;
      }
      setFileName(body.fileName);
      setFileSize(body.fileSize);
      onUploaded(body.id, { fileName: body.fileName, fileSize: body.fileSize });
      toast.success("Document uploaded");
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    setFileName(null);
    setFileSize(null);
    if (inputRef.current) inputRef.current.value = "";
    onCleared();
  }

  const hasFile = !!documentId;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card/40 p-4 transition-colors",
        hasFile ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/60",
        error && "border-destructive/60 bg-destructive/5",
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-foreground">
            {label}{required && <span className="ml-1 text-destructive">*</span>}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        {hasFile && (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />

      {!hasFile ? (
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="h-10 w-full rounded-lg"
        >
          {busy ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…</>
          ) : (
            <><Upload className="mr-2 h-4 w-4" /> Choose file</>
          )}
        </Button>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-background/60 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-[--color-brand-ocean]" />
            <div className="min-w-0">
              <div className="truncate text-xs font-medium">{fileName ?? "Uploaded"}</div>
              {fileSize !== null && (
                <div className="text-[10px] text-muted-foreground">
                  {(fileSize / 1024).toFixed(0)} KB
                </div>
              )}
            </div>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={clear}
            className="h-7 w-7 rounded-md text-destructive hover:bg-destructive/10"
            aria-label="Remove file"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
