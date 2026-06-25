"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  CheckCircle2, Ban, Loader2, Search, User, XCircle, AlertTriangle, Stethoscope,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BLOOD_TYPES } from "@/types";
import type { SerializedEmployee } from "@/lib/employee";
import { EmployeeStatusBadge } from "@/components/shared/EmployeeStatusBadge";

interface BlacklistedHit {
  nicNumber: string;
  name: string;
  reason: string;
  blacklistedAt: string;
}

export function ScreeningWorkstation() {
  const [nic, setNic] = useState("");
  const [searching, setSearching] = useState(false);
  const [employee, setEmployee] = useState<SerializedEmployee | null>(null);
  const [blacklisted, setBlacklisted] = useState<BlacklistedHit | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [docId, setDocId] = useState("");
  const [bloodType, setBloodType] = useState<string>("Unknown");

  const [passOpen, setPassOpen] = useState(false);
  const [failOpen, setFailOpen] = useState(false);
  const [failReason, setFailReason] = useState("");
  const [pending, start] = useTransition();

  const searchRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => { searchRef.current?.focus(); }, []);

  function reset() {
    setEmployee(null);
    setBlacklisted(null);
    setNotFound(false);
    setDocId("");
    setBloodType("Unknown");
    setFailReason("");
    setNic("");
    setTimeout(() => searchRef.current?.focus(), 30);
  }

  async function doSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const term = nic.trim();
    if (!term) return;
    setSearching(true);
    setEmployee(null);
    setBlacklisted(null);
    setNotFound(false);
    try {
      const res = await fetch(`/api/medical/employee/search?nic=${encodeURIComponent(term)}`);
      const body = await res.json();
      if (body.blacklisted) {
        setBlacklisted(body.blacklisted);
      } else if (body.match) {
        setEmployee(body.match);
      } else {
        setNotFound(true);
      }
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function callPass() {
    if (!employee) return;
    start(async () => {
      const res = await fetch(`/api/medical/employee/${employee.id}/pass`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicalDocumentId: docId.trim(), bloodType }),
      });
      const b = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(b.message ?? "Failed"); return; }
      toast.success("Employee passed", { description: "Sent to HSEQ Induction." });
      setPassOpen(false);
      reset();
    });
  }

  async function callFail() {
    if (!employee) return;
    if (failReason.trim().length < 3) {
      toast.error("Provide a rejection reason");
      return;
    }
    start(async () => {
      const res = await fetch(`/api/medical/employee/${employee.id}/fail`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: failReason.trim() }),
      });
      const b = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(b.message ?? "Failed"); return; }
      toast.success("Employee rejected", { description: "NIC blacklisted." });
      setFailOpen(false);
      reset();
    });
  }

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <form onSubmit={doSearch}
            className="rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-md sm:p-5">
        <Label htmlFor="nicSearch" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Search by NIC number
        </Label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="nicSearch"
              ref={searchRef}
              autoFocus
              value={nic}
              onChange={(e) => setNic(e.target.value)}
              placeholder="952341234V or 199523401234"
              className="h-12 pl-10 font-mono text-base uppercase tracking-wider"
            />
          </div>
          <Button type="submit" disabled={searching || !nic.trim()}
                  className="h-12 rounded-lg bg-[--color-brand-ocean] px-6 text-white hover:bg-[--color-brand-ocean]/90 active:scale-[0.98]">
            {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Search
          </Button>
        </div>
      </form>

      <AnimatePresence mode="wait">
        {/* Blacklist warning */}
        {blacklisted && (
          <motion.div key="bl" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="rounded-2xl border-l-4 border-red-500 border-border/60 bg-red-500/5 p-5">
              <div className="flex items-start gap-3">
                <Ban className="mt-0.5 h-5 w-5 text-red-500" />
                <div className="flex-1">
                  <p className="font-heading text-base font-semibold text-red-600">NIC is blacklisted</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This NIC was permanently blocked on {new Date(blacklisted.blacklistedAt).toLocaleString("en-GB")}.
                  </p>
                  <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <Item label="NIC" value={blacklisted.nicNumber} mono />
                    <Item label="Name" value={blacklisted.name || "—"} />
                    <Item label="Reason" value={blacklisted.reason || "—"} />
                  </dl>
                </div>
                <Button variant="ghost" onClick={reset}>Clear</Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Not found */}
        {notFound && (
          <motion.div key="nf" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
            <AlertTriangle className="mx-auto h-6 w-6 text-amber-500" />
            <p className="mt-2 font-heading text-base font-semibold">No pending employee found with this NIC</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Either the NIC is wrong, the employee has already been screened, or the contractor account hasn't been created yet.
            </p>
          </motion.div>
        )}

        {/* Employee + form */}
        {employee && (
          <motion.div key="emp" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md lg:col-span-3">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-border/60 bg-background/60 text-muted-foreground">
                  <User className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[--color-brand-ocean]">
                    Pending Screening
                  </p>
                  <h2 className="mt-1 font-heading text-xl font-semibold">{employee.name}</h2>
                  <p className="font-mono text-xs text-muted-foreground">{employee.nicNumber}</p>
                  <div className="mt-2"><EmployeeStatusBadge status={employee.status} /></div>
                </div>
              </div>

              <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Item label="Contractor" value={employee.companyName} />
                <Item label="Trade" value={employee.tradeType} />
                <Item label="Designation" value={employee.designation || "—"} />
                <Item label="Joined" value={employee.joinedDate ? new Date(employee.joinedDate).toLocaleDateString("en-GB") : "—"} />
                <Item label="Mobile" value={employee.mobileNumber || "—"} mono />
                <Item label="Emergency Contact" value={employee.emergencyContact || "—"} mono />
                <Item label="Address" value={employee.address || "—"} span />
              </dl>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md lg:col-span-2">
              <h3 className="font-heading text-base font-semibold">Screening Form</h3>
              <p className="mt-1 text-xs text-muted-foreground">Record the result, then take action.</p>

              <div className="mt-4 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="docId" className="text-xs uppercase tracking-wider text-muted-foreground">
                    Medical Document ID (optional)
                  </Label>
                  <Input id="docId" value={docId} onChange={(e) => setDocId(e.target.value)}
                         placeholder="MED-1234" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="blood" className="text-xs uppercase tracking-wider text-muted-foreground">
                    Blood Type (optional)
                  </Label>
                  <Select value={bloodType} onValueChange={setBloodType}>
                    <SelectTrigger id="blood"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BLOOD_TYPES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-2">
                <Button onClick={() => setPassOpen(true)} disabled={pending}
                        className="h-12 rounded-lg bg-emerald-600 text-white hover:bg-emerald-600/90 active:scale-[0.98]">
                  <CheckCircle2 className="mr-2 h-5 w-5" /> MARK AS PASSED
                </Button>
                <Button onClick={() => setFailOpen(true)} disabled={pending}
                        className="h-12 rounded-lg bg-red-600 text-white hover:bg-red-600/90 active:scale-[0.98]">
                  <XCircle className="mr-2 h-5 w-5" /> MARK AS FAILED
                </Button>
                <Button variant="ghost" onClick={reset} disabled={pending} className="mt-1">
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Idle state */}
        {!employee && !blacklisted && !notFound && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-12 text-center">
            <Stethoscope className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-heading text-base font-semibold">Ready for screening</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Type or scan the employee's NIC above to begin.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={passOpen} onOpenChange={setPassOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm pass</AlertDialogTitle>
            <AlertDialogDescription>
              {employee?.name} ({employee?.nicNumber}) will be marked PASSED and sent to HSEQ for induction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); void callPass(); }}
                               disabled={pending}
                               className="bg-emerald-600 text-white hover:bg-emerald-600/90">
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm pass
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={failOpen} onOpenChange={setFailOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject and blacklist?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reject the employee and permanently blacklist their NIC so they cannot be registered again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Rejection reason (required)</Label>
            <Textarea rows={5} value={failReason} onChange={(e) => setFailReason(e.target.value)}
                      placeholder="Describe the failed medical condition…" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); void callFail(); }}
                               disabled={pending || failReason.trim().length < 3}
                               className="bg-red-600 text-white hover:bg-red-600/90">
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject & blacklist
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Item({ label, value, mono, span }: { label: string; value: string; mono?: boolean; span?: boolean }) {
  return (
    <div className={span ? "sm:col-span-2" : ""}>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={"mt-0.5 text-sm text-foreground " + (mono ? "font-mono" : "")}>{value}</dd>
    </div>
  );
}
