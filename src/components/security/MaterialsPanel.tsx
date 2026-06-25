"use client";

import { Boxes, Building2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { MaterialsItem } from "@/lib/materialsPass";

interface Props {
  companyName: string;
  items: MaterialsItem[];
  onReset: () => void;
}

export function MaterialsPanel({ companyName, items, onReset }: Props) {
  return (
    <div className="rounded-2xl border-l-4 border-[--color-brand-ocean] border-border/60 bg-card/60 p-6 backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[--color-brand-ocean]/15 text-[--color-brand-ocean]">
            <Boxes className="h-6 w-6" />
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[--color-brand-ocean]">
              Contractor Materials
            </p>
            <h2 className="mt-1 flex items-center gap-2 font-heading text-2xl font-bold">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              {companyName || "Unknown contractor"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {items.length} item{items.length === 1 ? "" : "s"} registered to this contractor
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border/60 bg-background/40">
        {items.length === 0 ? (
          <EmptyState icon={Boxes} title="No materials registered" description="This contractor has no equipment or tools on record." />
        ) : (
          <div className="max-h-[360px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="w-28">Quantity</TableHead>
                  <TableHead>Remark</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it) => (
                  <TableRow key={it.no}>
                    <TableCell className="font-mono text-xs">{it.no}</TableCell>
                    <TableCell className="font-medium">{it.item}</TableCell>
                    <TableCell className="font-mono">{it.quantity}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{it.remark || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Button
        onClick={onReset}
        className="mt-6 h-12 rounded-lg bg-[--color-brand-ocean] px-6 text-white hover:bg-[--color-brand-ocean]/90"
      >
        <RotateCcw className="mr-2 h-4 w-4" /> Dismiss & Continue
      </Button>
    </div>
  );
}
