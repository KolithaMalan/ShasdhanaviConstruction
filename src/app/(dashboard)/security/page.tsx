import Link from "next/link";
import { LayoutDashboard, ScanLine } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Button } from "@/components/ui/button";
import { ScanWorkstation } from "@/components/security/ScanWorkstation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Scan Workstation" };

export default function SecurityScanPage() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Security Officer · Gate"
          title="Scan Workstation"
          description="Scan an employee ID, vehicle pass, or visitor pass. Use Space to mark IN, Backspace to mark OUT, Esc to reset."
          actions={
            <Button asChild variant="outline" className="rounded-lg">
              <Link href="/security/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" /> Live Dashboard
              </Link>
            </Button>
          }
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <ScanWorkstation />
      </MotionWrapper>

      {/* Keep ScanLine import for the icon used inside the workstation */}
      <ScanLine className="hidden" />
    </div>
  );
}
