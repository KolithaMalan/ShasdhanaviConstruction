import { notFound } from "next/navigation";
import Link from "next/link";
import mongoose from "mongoose";
import { ArrowLeft, HardHat, Truck, Wrench, Zap } from "lucide-react";

import { connectDB } from "@/lib/db";
import { AdditionalRequestModel } from "@/models/AdditionalRequest";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { AdditionalRequestActions } from "@/components/admin/AdditionalRequestActions";

export const dynamic = "force-dynamic";

export default async function AdditionalRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) notFound();

  await connectDB();
  const doc = await AdditionalRequestModel.findById(id).lean();
  if (!doc) notFound();

  const niceType = doc.requestType
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/admin/additional-requests"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to additional requests
      </Link>

      <MotionWrapper>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-md">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[--color-brand-ocean]">
                Additional Request · {niceType}
              </p>
              <h2 className="mt-1 font-heading text-2xl font-semibold">{doc.companyName}</h2>
              <p className="text-xs text-muted-foreground">
                Submitted {new Date(doc.submittedAt).toLocaleString("en-GB")}
              </p>
            </div>
            <StatusBadge status={doc.status} />
          </div>
        </div>
      </MotionWrapper>

      {doc.requestType === "LABOUR" && (
        <SectionTable
          icon={HardHat}
          title={`Labour (${doc.labourList.length})`}
          headers={["Name", "NIC", "Trade", "Designation", "Mobile", "Joined"]}
          rows={doc.labourList.map((l) => [
            l.name, l.nicNumber, l.tradeType, l.designation, l.mobileNumber,
            new Date(l.joinedDate).toLocaleDateString("en-GB"),
          ])}
        />
      )}

      {doc.requestType === "VEHICLE" && (
        <SectionTable
          icon={Truck}
          title={`Vehicles (${doc.vehicles.length})`}
          headers={["Number", "Type", "Colour", "Purpose"]}
          rows={doc.vehicles.map((v) => [v.vehicleNumber, v.vehicleType, v.vehicleColour, v.vehiclePurpose])}
        />
      )}

      {doc.requestType === "ELECTRICAL_EQUIPMENT" && (
        <SectionTable
          icon={Zap}
          title={`Electrical Equipment (${doc.electricalEquipment.length})`}
          headers={["Tool", "Category", "Qty", "Serial", "Power"]}
          rows={doc.electricalEquipment.map((e) => [e.toolName, e.category, String(e.quantity), e.serialNumber || "—", e.powerDetails || "—"])}
        />
      )}

      {doc.requestType === "NON_ELECTRICAL_TOOLS" && (
        <SectionTable
          icon={Wrench}
          title={`Non-Electrical Tools (${doc.nonElectricalTools.length})`}
          headers={["Tool", "Category", "Qty", "Unit"]}
          rows={doc.nonElectricalTools.map((t) => [t.toolName, t.category, String(t.quantity), t.unit])}
        />
      )}

      {doc.adminNotes && (
        <MotionWrapper delay={0.1}>
          <div className="rounded-2xl border-l-4 border-amber-500 border-border/60 bg-amber-500/5 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-amber-600">Admin Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{doc.adminNotes}</p>
          </div>
        </MotionWrapper>
      )}

      <AdditionalRequestActions id={String(doc._id)} status={doc.status} />
    </div>
  );
}

function SectionTable({
  icon: Icon, title, headers, rows,
}: { icon: typeof HardHat; title: string; headers: string[]; rows: string[][] }) {
  return (
    <MotionWrapper delay={0.05}>
      <section className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-background/60">
            <Icon className="h-4 w-4" />
          </div>
          <h3 className="font-heading text-base font-semibold">{title}</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>{headers.map((h) => <TableHead key={h}>{h}</TableHead>)}</TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>
                {r.map((c, j) => (
                  <TableCell key={j} className={j === 0 ? "font-medium" : ""}>{c}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </MotionWrapper>
  );
}
