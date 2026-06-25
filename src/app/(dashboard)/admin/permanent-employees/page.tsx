"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  BadgeCheck, Camera, Download, IdCard, Loader2, Plus, Search,
} from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PhotoCaptureField } from "@/components/shared/PhotoCaptureField";

interface Row {
  id: string;
  name: string;
  designation: string;
  department: string;
  nicNumber: string;
  permanentId: string;
  photoUrl: string;
  createdAt: string | null;
}

export default function PermanentEmployeesPage() {
  const [items, setItems] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  function load() {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    setLoading(true);
    fetch(`/api/admin/permanent-employees?${params}`)
      .then((r) => r.json())
      .then((b) => setItems(b.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function downloadCard(r: Row) {
    setDownloadingId(r.id);
    try {
      const res = await fetch(`/api/admin/permanent-employees/${r.id}/id-card-pdf`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `permanent-id-${r.permanentId}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success("ID card downloaded");
    } catch {
      toast.error("Download failed");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Admin · HSEQ"
          title="Permanent Employees"
          description="Register permanent staff and issue their no-expiry Site Access Pass."
          actions={<AddPermanentEmployeeDialog onCreated={load} />}
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Search</label>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") load(); }}
              placeholder="Name, NIC, ID, designation…"
              className="h-10 w-72"
            />
          </div>
          <Button onClick={load} className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
            <Search className="mr-2 h-4 w-4" /> Apply
          </Button>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.1}>
        {items === null ? <Skeleton className="h-64 w-full" /> :
         items.length === 0 ? (
           <EmptyState icon={BadgeCheck} title="No permanent employees yet" description="Click “Add Permanent Employee” to register staff and issue a pass." />
         ) : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Photo</TableHead>
                  <TableHead>Permanent ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>NIC</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="h-9 w-9 overflow-hidden rounded-full border border-border/60 bg-background">
                        {r.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.photoUrl} alt={r.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-muted-foreground">
                            {r.name?.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{r.permanentId}</TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.designation || "—"}</TableCell>
                    <TableCell>{r.department || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{r.nicNumber}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <UpdatePhotoDialog row={r} onSaved={load} />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadCard(r)}
                          disabled={downloadingId === r.id}
                          className="rounded-lg"
                        >
                          {downloadingId === r.id
                            ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            : <Download className="mr-1.5 h-3.5 w-3.5" />}
                          ID Card
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
         )}
      </MotionWrapper>
    </div>
  );
}

function AddPermanentEmployeeDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [nic, setNic] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, start] = useTransition();

  function reset() {
    setName(""); setDesignation(""); setDepartment(""); setNic(""); setPhoto(null);
  }

  function submit() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (!nic.trim()) { toast.error("NIC is required"); return; }
    start(async () => {
      try {
        const res = await fetch("/api/admin/permanent-employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            designation: designation.trim(),
            department: department.trim(),
            nicNumber: nic.trim(),
            photoDataUrl: photo ?? undefined,
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.message ?? "Failed to add");
        toast.success("Permanent employee added", { description: body.item?.permanentId });
        reset();
        setOpen(false);
        onCreated();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to add");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
          <Plus className="mr-2 h-4 w-4" /> Add Permanent Employee
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IdCard className="h-5 w-5 text-[--color-brand-ocean]" /> Add Permanent Employee
          </DialogTitle>
          <DialogDescription>
            A no-expiry Site Access Pass is generated automatically on save.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Photo</Label>
            <PhotoCaptureField value={photo} onChange={setPhoto} />
          </div>
          <Field id="pe-name" label="Name" value={name} onChange={setName} placeholder="Full name" required />
          <Field id="pe-designation" label="Designation" value={designation} onChange={setDesignation} placeholder="e.g. Site Engineer" />
          <Field id="pe-department" label="Department" value={department} onChange={setDepartment} placeholder="e.g. Operations" />
          <Field id="pe-nic" label="NIC" value={nic} onChange={(v) => setNic(v.toUpperCase())} placeholder="e.g. 952341234V" mono required />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving} className="rounded-lg">
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving} className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-2 h-4 w-4" />}
            Save & Issue Pass
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UpdatePhotoDialog({ row, onSaved }: { row: Row; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, start] = useTransition();

  function submit() {
    if (!photo) { toast.error("Capture or upload a photo first"); return; }
    start(async () => {
      try {
        const res = await fetch(`/api/admin/permanent-employees/${row.id}/photo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoDataUrl: photo }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.message ?? "Upload failed");
        toast.success("Photo updated");
        setPhoto(null);
        setOpen(false);
        onSaved();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setPhoto(null); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-lg">
          <Camera className="mr-1.5 h-3.5 w-3.5" /> Photo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-[--color-brand-ocean]" /> {row.photoUrl ? "Update" : "Add"} Photo
          </DialogTitle>
          <DialogDescription>
            {row.name} · {row.permanentId}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <PhotoCaptureField value={photo} onChange={setPhoto} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving} className="rounded-lg">
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || !photo} className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
            Save Photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  id, label, value, onChange, placeholder, mono, required,
}: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; placeholder?: string; mono?: boolean; required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={mono ? "font-mono uppercase" : ""}
      />
    </div>
  );
}
