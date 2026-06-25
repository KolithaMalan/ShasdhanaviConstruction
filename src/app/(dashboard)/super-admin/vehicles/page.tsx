import Link from "next/link";
import { ArrowRight, Truck } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Button } from "@/components/ui/button";

export default function SuperAdminVehiclesIndex() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Super Admin"
          title="All Vehicles"
          description="The Admin vehicles screen aggregates every contractor's vehicles in one searchable view — use it for QR downloads, movement history, and PDF passes."
          actions={
            <Button asChild className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
              <Link href="/admin/vehicles">
                <Truck className="mr-2 h-4 w-4" /> Open Vehicles Console <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />
      </MotionWrapper>
    </div>
  );
}
