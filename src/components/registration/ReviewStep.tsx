"use client";

import { useState } from "react";
import { Edit3, Send, Loader2, Building2, HardHat, Truck, Zap, Wrench, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { RegistrationInput } from "@/lib/validators";

interface ReviewStepProps {
  data: RegistrationInput;
  onEdit: (step: number) => void;
  onSubmit: () => Promise<void> | void;
  submitting: boolean;
}

export function ReviewStep({ data, onEdit, onSubmit, submitting }: ReviewStepProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">Review & Submit</h2>
        <p className="text-sm text-muted-foreground">
          Verify everything is correct. Once you submit, the request becomes read-only until the Admin team responds.
        </p>
      </div>

      <Section icon={Building2} title="Company" onEdit={() => onEdit(1)}>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Item label="Company Name" value={data.companyName} />
          <Item label="Email" value={data.email} mono />
          <Item label="BR Number" value={data.brNumber} mono />
          <Item label="Contact Number" value={data.contactNumber} mono />
          <Item label="PO Number" value={data.poNumber} mono />
          <Item label="Office Address" value={data.officeAddress} span />
          <Item label="Scope of Work" value={data.scopeOfWork} span />
          <Item label="Safety Plans" value={data.safetyPlanDocId ? "Uploaded ✓" : "Missing"} />
          <Item label="Management Documents" value={data.cmdDocId ? "Uploaded ✓" : "Not provided"} />
        </dl>
      </Section>

      <Section icon={HardHat} title={`Labour (${data.labourList.length})`} onEdit={() => onEdit(2)}>
        {data.labourList.length === 0 ? (
          <p className="text-sm text-muted-foreground">No employees included in this registration.</p>
        ) : (
          <ScrollArea className="max-h-72 rounded-lg border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>NIC</TableHead>
                  <TableHead>Trade</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.labourList.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="font-mono text-xs">{row.nicNumber}</TableCell>
                    <TableCell>{row.tradeType}</TableCell>
                    <TableCell>{row.designation}</TableCell>
                    <TableCell>{new Date(row.joinedDate).toLocaleDateString("en-GB")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </Section>

      <Section icon={Truck} title={`Vehicles (${data.vehicles.length})`} onEdit={() => onEdit(3)}>
        {data.vehicles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No vehicles included.</p>
        ) : (
          <ScrollArea className="max-h-72 rounded-lg border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Colour</TableHead>
                  <TableHead>Purpose</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.vehicles.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{row.vehicleNumber}</TableCell>
                    <TableCell>{row.vehicleType}</TableCell>
                    <TableCell>{row.vehicleColour}</TableCell>
                    <TableCell className="max-w-[280px] truncate">{row.vehiclePurpose}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </Section>

      <Section icon={Zap} title={`Electrical Equipment (${data.electricalEquipment.length})`} onEdit={() => onEdit(4)}>
        {data.electricalEquipment.length === 0 ? (
          <p className="text-sm text-muted-foreground">No electrical equipment included.</p>
        ) : (
          <ScrollArea className="max-h-72 rounded-lg border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tool</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Serial</TableHead>
                  <TableHead>Power</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.electricalEquipment.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{row.toolName}</TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell>{row.quantity}</TableCell>
                    <TableCell className="font-mono text-xs">{row.serialNumber || "—"}</TableCell>
                    <TableCell>{row.powerDetails || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </Section>

      <Section icon={Wrench} title={`Non-Electrical Tools (${data.nonElectricalTools.length})`} onEdit={() => onEdit(5)}>
        {data.nonElectricalTools.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tools included.</p>
        ) : (
          <ScrollArea className="max-h-72 rounded-lg border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tool</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.nonElectricalTools.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{row.toolName}</TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell>{row.quantity}</TableCell>
                    <TableCell>{row.unit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </Section>

      <div className="flex items-center justify-between rounded-xl border border-[--color-brand-ocean]/30 bg-[--color-brand-ocean]/5 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-[--color-brand-ocean]" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Ready to submit</p>
            <p className="text-muted-foreground">You will receive a confirmation email and a notification when the Admin reviews your request.</p>
          </div>
        </div>
        <Button
          type="button"
          onClick={() => setOpen(true)}
          disabled={submitting}
          className="h-12 rounded-lg bg-[--color-brand-ocean] px-6 text-white hover:bg-[--color-brand-ocean]/90 active:scale-[0.98]"
        >
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Submit Registration Request
        </Button>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit registration?</AlertDialogTitle>
            <AlertDialogDescription>
              You cannot edit this submission afterwards. Make sure all details — especially
              company contact and NIC numbers — are correct.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Review again</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              onClick={async (e) => {
                e.preventDefault();
                await onSubmit();
                setOpen(false);
              }}
              className="bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90"
            >
              {submitting ? "Submitting…" : "Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Section({
  icon: Icon, title, onEdit, children,
}: {
  icon: typeof Building2; title: string;
  onEdit: () => void; children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-background/60">
            <Icon className="h-4 w-4" />
          </div>
          <h3 className="font-heading text-base font-semibold">{title}</h3>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
          <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit
        </Button>
      </div>
      {children}
    </motion.section>
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
