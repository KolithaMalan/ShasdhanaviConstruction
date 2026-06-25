"use client";

import { memo } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SerializedVehicle } from "@/lib/vehicle";

interface Props {
  vehicle: SerializedVehicle;
  pending: boolean;
  onMark: (direction: "IN" | "OUT") => void;
}

function VehicleResultPanelInner({ vehicle, pending, onMark }: Props) {
  const inside = vehicle.currentStatus === "IN";
  return (
    <div className="flex h-full flex-col gap-6 rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <span className={
          "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-2xl font-semibold uppercase tracking-wide " +
          (inside
            ? "bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/40"
            : "bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/40")
        }>
          <span className="h-2.5 w-2.5 rounded-full bg-current" />
          {inside ? "VEHICLE INSIDE" : "VEHICLE OUTSIDE"}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Vehicle · {vehicle.vehicleType}
        </span>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex h-44 w-44 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background text-[--color-brand-ocean]">
          <Truck className="h-20 w-20" />
        </div>
        <div className="space-y-3">
          <h2 className="font-mono text-[44px] font-bold leading-none tracking-tight">{vehicle.vehicleNumber}</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Item label="Colour" value={vehicle.vehicleColour || "—"} />
            <Item label="Type" value={vehicle.vehicleType} />
            <Item label="Contractor" value={vehicle.companyName} />
            <Item label="Purpose" value={vehicle.vehiclePurpose || "—"} />
          </dl>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-3">
        <Button
          type="button"
          disabled={pending || inside}
          onClick={() => onMark("IN")}
          className={
            "h-20 rounded-2xl text-2xl font-bold tracking-wide text-white transition-all " +
            (inside
              ? "cursor-not-allowed bg-emerald-900/30 ring-1 ring-emerald-700/30 opacity-60"
              : "bg-emerald-600 ring-1 ring-emerald-500/40 hover:bg-emerald-500 active:scale-[0.98] shadow-lg shadow-emerald-600/30")
          }
        >
          <ArrowDownToLine className="mr-3 h-7 w-7" /> MARK IN
        </Button>
        <Button
          type="button"
          disabled={pending || !inside}
          onClick={() => onMark("OUT")}
          className={
            "h-20 rounded-2xl text-2xl font-bold tracking-wide text-white transition-all " +
            (!inside
              ? "cursor-not-allowed bg-red-900/30 ring-1 ring-red-700/30 opacity-60"
              : "bg-red-600 ring-1 ring-red-500/40 hover:bg-red-500 active:scale-[0.98] shadow-lg shadow-red-600/30")
          }
        >
          <ArrowUpFromLine className="mr-3 h-7 w-7" /> MARK OUT
        </Button>
      </div>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export const VehicleResultPanel = memo(VehicleResultPanelInner);
