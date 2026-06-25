import Link from "next/link";
import { ArrowRight, Wrench } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Button } from "@/components/ui/button";

export default function SuperAdminEquipmentIndex() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Super Admin"
          title="All Equipment"
          description="Full electrical + non-electrical inventory across every contractor lives in the Admin tools-inventory console."
          actions={
            <Button asChild className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
              <Link href="/admin/tools-inventory">
                <Wrench className="mr-2 h-4 w-4" /> Open Tools Inventory <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />
      </MotionWrapper>
    </div>
  );
}
