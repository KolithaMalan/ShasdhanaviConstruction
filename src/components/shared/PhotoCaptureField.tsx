"use client";

import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import { toast } from "sonner";
import { Camera, ImageUp, RotateCcw, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Props {
  /** Current image as a base64 data URL, or null. */
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}

const VIDEO_CONSTRAINTS = {
  width: 720,
  height: 720,
  facingMode: "user",
} satisfies MediaTrackConstraints;

/** Photo input that lets the user capture from a webcam or upload a file.
 *  Returns the image to the parent as a base64 data URL (no upload here). */
export function PhotoCaptureField({ value, onChange }: Props) {
  const [camOpen, setCamOpen] = useState(false);
  const webcamRef = useRef<Webcam | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const capture = useCallback(() => {
    const ss = webcamRef.current?.getScreenshot({ width: 720, height: 720 });
    if (!ss) {
      toast.error("Could not capture photo — check camera permissions");
      return;
    }
    onChange(ss);
    setCamOpen(false);
  }, [onChange]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      toast.error("Please choose a PNG, JPG or WEBP image");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image is too large (max 8MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => toast.error("Could not read the file");
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-4">
        {/* Preview / camera */}
        <div className="relative h-36 w-32 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-background">
          {camOpen ? (
            <>
              <Webcam
                ref={webcamRef}
                audio={false}
                mirrored
                screenshotFormat="image/jpeg"
                screenshotQuality={0.92}
                videoConstraints={VIDEO_CONSTRAINTS}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setCamOpen(false)}
                className="absolute right-1 top-1 rounded-md bg-black/50 p-1 text-white hover:bg-black/70"
                aria-label="Close camera"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Photo preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
              <Camera className="h-7 w-7" />
              <span className="text-[10px] uppercase tracking-wider">No photo</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-1 flex-col gap-2">
          {camOpen ? (
            <Button type="button" size="sm" onClick={capture}
                    className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
              <Camera className="mr-2 h-4 w-4" /> Capture
            </Button>
          ) : (
            <Button type="button" size="sm" variant="outline" onClick={() => setCamOpen(true)} className="rounded-lg">
              <Camera className="mr-2 h-4 w-4" /> {value ? "Retake with Webcam" : "Use Webcam"}
            </Button>
          )}

          <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="rounded-lg">
            {value ? <RotateCcw className="mr-2 h-4 w-4" /> : <ImageUp className="mr-2 h-4 w-4" />}
            {value ? "Replace from Computer" : "Upload from Computer"}
          </Button>

          {value && (
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}
                    className="rounded-lg text-red-500 hover:text-red-600">
              <Trash2 className="mr-2 h-4 w-4" /> Remove
            </Button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onFile}
            className="hidden"
          />
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Capture from the webcam or upload a clear, front-facing photo.
        <br />
        Accepted: <span className="font-medium text-foreground">PNG, JPG or WEBP</span> ·
        Max file size: <span className="font-medium text-foreground">8&nbsp;MB</span>.
        Larger images will not be uploaded.
      </p>
    </div>
  );
}
