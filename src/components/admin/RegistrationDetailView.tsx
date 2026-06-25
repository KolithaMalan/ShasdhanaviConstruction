"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, AlertTriangle, UserPlus, Building2, HardHat, Truck, Zap, Wrench } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ReviewDialog } from "@/components/admin/ReviewDialog";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import type { RegistrationStatus } from "@/types";

interface DetailItem {
  id: string;
  companyName: string;
  email: string;
  brNumber: string;
  contactNumber: string;
  poNumber: string;
  officeAddress: string;
  scopeOfWork: string;
  hasSafetyPlan: boolean;
  hasContractorManagementDocs: boolean;
  safetyPlanDocId?: string | null;
  cmdDocId?: string | null;
  labourList: Array<{
    name: string; nicNumber: string; address: string; mobileNumber: string;
    emergencyContact: string; tradeType: string; designation: string; joinedDate: string;
  }>;
  vehicles: Array<{ vehicleNumber: string; vehicleType: string; vehicleColour: string; vehiclePurpose: string }>;
  electricalEquipment: Array<{ toolName: string; category: string; quantity: number; serialNumber: string; powerDetails: string }>;
  nonElectricalTools: Array<{ toolName: string; category: string; quantity: number; unit: string }>;
  status: RegistrationStatus;
  adminNotes: string;
  submittedAt: string;
  contractorAccountCreated: boolean;
}

interface Props { item: DetailItem }

export function RegistrationDetailView({ item }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [correctionsOpen, setCorrectionsOpen] = useState(false);

  const canAct = item.status === "PENDING" || item.status === "UNDER_REVIEW" || item.status === "CORRECTIONS_REQUESTED";
  const canCreateAccount = item.status === "APPROVED" && !item.contractorAccountCreated;

  async function call(path: string, notes?: string) {
    const res = await fetch(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: notes ?? "" }),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      throw new Error(b.message ?? "Action failed");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <MotionWrapper>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-md">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[--color-brand-ocean]">
                Registration Request
              </p>
              <h2 className="mt-1 font-heading text-2xl font-semibold">{item.companyName}</h2>
              <p className="font-mono text-xs text-muted-foreground">{item.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={item.status} />
              {item.contractorAccountCreated && (
                <Badge variant="secondary" className="rounded-md">Account created</Badge>
              )}
            </div>
          </div>
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <Section icon={Building2} title="Company Information">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
            <Item label="BR Number" value={item.brNumber} mono />
            <Item label="Contact Number" value={item.contactNumber} mono />
            <Item label="PO Number" value={item.poNumber} mono />
            <Item label="Submitted" value={new Date(item.submittedAt).toLocaleString("en-GB")} />
            <Item label="Office Address" value={item.officeAddress} span />
            <Item label="Scope of Work" value={item.scopeOfWork} span />
            <DocLink label="Safety Plans" id={item.safetyPlanDocId ?? null} fallback={item.hasSafetyPlan ? "Confirmed (no file)" : "Not provided"} />
            <DocLink label="Management Documents" id={item.cmdDocId ?? null} fallback={item.hasContractorManagementDocs ? "Confirmed (no file)" : "Not provided"} />
          </dl>
        </Section>
      </MotionWrapper>

      <MotionWrapper delay={0.08}>
        <Section icon={HardHat} title={`Labour (${item.labourList.length})`}>
          {item.labourList.length === 0 ? <Empty /> : (
            <ScrollArea className="max-h-80 rounded-lg border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead><TableHead>NIC</TableHead>
                    <TableHead>Trade</TableHead><TableHead>Designation</TableHead>
                    <TableHead>Mobile</TableHead><TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {item.labourList.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{l.name}</TableCell>
                      <TableCell className="font-mono text-xs">{l.nicNumber}</TableCell>
                      <TableCell>{l.tradeType}</TableCell>
                      <TableCell>{l.designation}</TableCell>
                      <TableCell className="font-mono text-xs">{l.mobileNumber}</TableCell>
                      <TableCell>{new Date(l.joinedDate).toLocaleDateString("en-GB")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </Section>
      </MotionWrapper>

      <MotionWrapper delay={0.1}>
        <Section icon={Truck} title={`Vehicles (${item.vehicles.length})`}>
          {item.vehicles.length === 0 ? <Empty /> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Number</TableHead><TableHead>Type</TableHead>
                <TableHead>Colour</TableHead><TableHead>Purpose</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {item.vehicles.map((v, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{v.vehicleNumber}</TableCell>
                    <TableCell>{v.vehicleType}</TableCell>
                    <TableCell>{v.vehicleColour}</TableCell>
                    <TableCell>{v.vehiclePurpose}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Section>
      </MotionWrapper>

      <MotionWrapper delay={0.12}>
        <Section icon={Zap} title={`Electrical Equipment (${item.electricalEquipment.length})`}>
          {item.electricalEquipment.length === 0 ? <Empty /> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Tool</TableHead><TableHead>Category</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead>Serial</TableHead><TableHead>Power</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {item.electricalEquipment.map((e, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{e.toolName}</TableCell>
                    <TableCell>{e.category}</TableCell>
                    <TableCell className="text-center">{e.quantity}</TableCell>
                    <TableCell className="font-mono text-xs">{e.serialNumber || "—"}</TableCell>
                    <TableCell>{e.powerDetails || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Section>
      </MotionWrapper>

      <MotionWrapper delay={0.14}>
        <Section icon={Wrench} title={`Non-Electrical Tools (${item.nonElectricalTools.length})`}>
          {item.nonElectricalTools.length === 0 ? <Empty /> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Tool</TableHead><TableHead>Category</TableHead>
                <TableHead className="text-center">Qty</TableHead><TableHead>Unit</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {item.nonElectricalTools.map((t, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{t.toolName}</TableCell>
                    <TableCell>{t.category}</TableCell>
                    <TableCell className="text-center">{t.quantity}</TableCell>
                    <TableCell>{t.unit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Section>
      </MotionWrapper>

      {item.adminNotes && (
        <MotionWrapper delay={0.16}>
          <div className="rounded-2xl border-l-4 border-amber-500 border-border/60 bg-amber-500/5 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-amber-600">Admin Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{item.adminNotes}</p>
          </div>
        </MotionWrapper>
      )}

      <MotionWrapper delay={0.18}>
        <div className="sticky bottom-4 flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-border/60 bg-card/80 p-3 backdrop-blur-xl">
          {canAct && (
            <>
              <Button
                variant="outline"
                onClick={() => setCorrectionsOpen(true)}
                disabled={pending}
                className="border-amber-500/40 text-amber-600 hover:bg-amber-500/10"
              >
                <AlertTriangle className="mr-2 h-4 w-4" /> Request Corrections
              </Button>
              <Button
                variant="outline"
                onClick={() => setRejectOpen(true)}
                disabled={pending}
                className="border-red-500/40 text-red-600 hover:bg-red-500/10"
              >
                <XCircle className="mr-2 h-4 w-4" /> Reject
              </Button>
              <Button
                onClick={() => setApproveOpen(true)}
                disabled={pending}
                className="bg-emerald-600 text-white hover:bg-emerald-600/90"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
              </Button>
            </>
          )}
          {canCreateAccount && (
            <Button
              onClick={() => router.push(`/admin/create-contractor-account/${item.id}`)}
              className="bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90"
            >
              <UserPlus className="mr-2 h-4 w-4" /> Create Account
            </Button>
          )}
        </div>
      </MotionWrapper>

      <ReviewDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Approve registration?"
        description="The contractor's registration will move to APPROVED. You'll then be guided to create their login account."
        confirmLabel="Approve"
        variant="approve"
        onConfirm={async () => {
          startTransition(async () => {
            try {
              await call(`/api/admin/registrations/${item.id}/approve`);
              toast.success("Registration approved");
              router.push(`/admin/create-contractor-account/${item.id}`);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Approve failed");
            }
          });
        }}
      />
      <ReviewDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject registration?"
        description="The contractor will be notified by email."
        confirmLabel="Reject"
        variant="reject"
        requireNotes
        onConfirm={async (notes) => {
          startTransition(async () => {
            try {
              await call(`/api/admin/registrations/${item.id}/reject`, notes);
              toast.success("Registration rejected");
              router.refresh();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Reject failed");
            }
          });
        }}
      />
      <ReviewDialog
        open={correctionsOpen}
        onOpenChange={setCorrectionsOpen}
        title="Request corrections?"
        description="The contractor will be notified of the corrections needed."
        confirmLabel="Send Request"
        variant="corrections"
        requireNotes
        onConfirm={async (notes) => {
          startTransition(async () => {
            try {
              await call(`/api/admin/registrations/${item.id}/corrections`, notes);
              toast.success("Correction request sent");
              router.refresh();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Failed");
            }
          });
        }}
      />
    </div>
  );
}

function Section({
  icon: Icon, title, children,
}: { icon: typeof Building2; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-background/60">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="font-heading text-base font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Item({ label, value, span, mono }: { label: string; value: string; span?: boolean; mono?: boolean }) {
  return (
    <div className={span ? "sm:col-span-2" : ""}>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={"mt-0.5 text-sm text-foreground " + (mono ? "font-mono" : "")}>{value || "—"}</dd>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground">None.</p>;
}

function DocLink({ label, id, fallback }: { label: string; id: string | null; fallback: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">
        {id ? (
          <a
            href={`/api/admin/documents/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-500 transition hover:bg-emerald-500/20"
          >
            View / Download
          </a>
        ) : (
          <span className="text-muted-foreground">{fallback}</span>
        )}
      </dd>
    </div>
  );
}
