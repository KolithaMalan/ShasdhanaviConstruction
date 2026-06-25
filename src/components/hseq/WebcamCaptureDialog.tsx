"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import Webcam from "react-webcam";
import { toast } from "sonner";
import { Camera, Loader2, RotateCcw, Save, Video } from "lucide-react";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  trigger: React.ReactNode;
  employeeId: string;
  /**
   * Called once the upload succeeds.
   *  - photoUrl:    canonical server URL (`/api/photos/EMPLOYEE/{NIC}`)
   *  - localDataUrl: the original base64 capture, used by the page for an
   *    instant in-session preview that does not depend on a server roundtrip.
   */
  onSaved: (photoUrl: string, localDataUrl: string) => void;
}

const VIDEO_CONSTRAINTS = {
  width: 720,
  height: 720,
  facingMode: "user",
} satisfies MediaTrackConstraints;

export function WebcamCaptureDialog({ trigger, employeeId, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [shot, setShot] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const webcamRef = useRef<Webcam | null>(null);

  const capture = useCallback(() => {
    const ss = webcamRef.current?.getScreenshot({ width: 720, height: 720 });
    if (!ss) {
      toast.error("Could not capture photo");
      return;
    }
    setShot(ss);
  }, []);

  function retake() { setShot(null); }

  function save() {
    if (!shot) return;
    start(async () => {
      try {
        const res = await fetch(`/api/hseq/employees/${employeeId}/upload-photo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoDataUrl: shot }),
        });
        const b = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(b.message ?? "Upload failed");
        toast.success("Photo saved");
        onSaved(b.photoUrl as string, shot);
        setShot(null);
        setOpen(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setShot(null);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-[--color-brand-ocean]" />
            Capture Employee Photo
          </DialogTitle>
          <DialogDescription>
            Centre the employee's face in the frame. Use good, even lighting.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-2xl border border-border/60 bg-black">
          {shot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shot} alt="Captured" className="h-full w-full object-cover" />
          ) : (
            <Webcam
              ref={webcamRef}
              audio={false}
              mirrored
              screenshotFormat="image/jpeg"
              screenshotQuality={0.92}
              videoConstraints={VIDEO_CONSTRAINTS}
              className="h-full w-full object-cover"
            />
          )}
          <div className="pointer-events-none absolute inset-6 rounded-full border-2 border-dashed border-white/30" />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {shot ? (
            <>
              <Button type="button" variant="ghost" onClick={retake} disabled={pending}>
                <RotateCcw className="mr-2 h-4 w-4" /> Retake
              </Button>
              <Button type="button" onClick={save} disabled={pending}
                      className="bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save & Close
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="button" onClick={capture}
                      className="bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
                <Camera className="mr-2 h-4 w-4" /> Capture
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
